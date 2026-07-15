import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/gemini';
import { connectToDatabase } from '@/lib/db';
import Chat from '@/models/Chat';
import Log from '@/models/Log';
import User from '@/models/User';
import Task from '@/models/Task';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

const apiKey = process.env.GEMINI_API_KEY;

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    await connectToDatabase();

    const chat = await Chat.findOne({ userId: user.userId });
    return NextResponse.json({ messages: chat?.messages || [] });
  } catch (error: any) {
    console.error('Fetch Chat Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is not configured on the server.' },
        { status: 500 }
      );
    }

    await connectToDatabase();
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // 1. Fetch current chat history
    let chat = await Chat.findOne({ userId: user.userId });
    if (!chat) {
      chat = new Chat({ userId: user.userId, messages: [] });
    }

    // Save user's message
    chat.messages.push({ role: 'user', content: message, timestamp: new Date() });

    // 2. Fetch today's logs & user profile to provide context
    const userDoc = await User.findById(user.userId);
    const userWeight = userDoc?.weight ? `${userDoc.weight} kg` : 'Not provided yet';
    const userHeight = userDoc?.height ? `${userDoc.height} cm` : 'Not provided yet';
    const userAge = userDoc?.age ? `${userDoc.age} years` : 'Not provided yet';
    const userGender = userDoc?.gender && userDoc.gender !== 'none' ? userDoc.gender : 'Not provided yet';
    const userActivity = userDoc?.activityLevel && userDoc.activityLevel !== 'none' ? userDoc.activityLevel : 'Not provided yet';
    const targetCalories = userDoc?.targetCalories || 2000;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await Log.find({
      userId: user.userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const todayCA = new Date().toLocaleDateString('en-CA');
    const startOfToday = new Date(todayCA + 'T00:00:00');
    const endOfToday = new Date(todayCA + 'T23:59:59.999');

    const tasks = await Task.find({
      userId: user.userId,
      $or: [
        { isRecurring: false, date: { $gte: startOfToday, $lte: endOfToday } },
        { isRecurring: true, createdAt: { $lte: endOfToday } },
      ],
    });

    const activeTasks = tasks.map((t: any) => {
      const isDone = t.isRecurring ? t.completedDates.includes(todayCA) : t.completed;
      const timeStr = t.time ? ` at ${t.time}` : '';
      return `- ID: ${t._id} | ${t.text}${timeStr} | [${t.isRecurring ? 'Daily Habit' : 'One-off Task'}] | Status: ${isDone ? 'Completed' : 'Pending'}`;
    });

    let totalCaloriesIn = 0;
    let totalCaloriesOut = 0;
    const foodLogs: string[] = [];
    const workoutLogs: string[] = [];

    logs.forEach((log) => {
      if (log.type === 'food') {
        totalCaloriesIn += log.caloriesIn || 0;
        foodLogs.push(`- ID: ${log._id} | [${log.mealType}] ${log.name}: ${log.caloriesIn} kcal (P: ${log.protein}g, C: ${log.carbs}g, F: ${log.fat}g)`);
      } else {
        totalCaloriesOut += log.caloriesOut || 0;
        workoutLogs.push(`- ID: ${log._id} | ${log.name}: burned ${log.caloriesOut} kcal over ${log.duration} mins`);
      }
    });

    const context = `
You are a premium AI Diet and Workout Assistant. You help the user manage their daily logs and fitness goals.
Today's Date: ${new Date().toDateString()}.
The user's username is: ${user.username}.

The user's current logs for TODAY:
- Total Calories Ingested: ${totalCaloriesIn} kcal
- Total Calories Burned: ${totalCaloriesOut} kcal
- Net Calories: ${totalCaloriesIn - totalCaloriesOut} kcal

Food Logged Today:
${foodLogs.length > 0 ? foodLogs.join('\n') : 'No food logged yet.'}

Workouts Logged Today:
${workoutLogs.length > 0 ? workoutLogs.join('\n') : 'No workouts logged yet.'}

Checklist Goals (Habits/Todos) for Today:
${activeTasks.length > 0 ? activeTasks.join('\n') : 'No tasks/habits created for today yet.'}

User Profile Details:
- Weight: ${userWeight}
- Height: ${userHeight}
- Age: ${userAge}
- Gender: ${userGender}
- Activity Level: ${userActivity}
- Daily Energy Requirement: ${targetCalories} kcal (This is set dynamically based on user profile BMR and Activity Level)

Antihallucination & Function Calling Rules:
1. If the user asks for exact calorie estimations of a meal they describe, clearly explain that it is an estimation and state any assumptions (like standard portion sizes) you make.
2. For workouts, base calorie burn rates on standard weights (e.g. 70kg / 155lbs) if the user's weight is unknown, and mention this assumption.
3. Be professional, supportive, concise, and encourage healthy sustainable habits. Do not provide medical diagnoses or prescribe diets for medical conditions.
4. If the user shares their weight, height, age, gender, or activity level, use the 'updateUserProfile' tool to calculate and set their daily calorie requirement (BMR/TDEE). Always explain the BMR/TDEE calculation and confirm it is saved.
5. Whenever you call the 'logFood' tool, you MUST calculate and estimate the protein, carbs, and fat in grams. Always make your best estimation based on nutritional standards; do not leave them blank or set them to 0 unless it makes sense for that item (e.g. water).
6. If the user requests to edit, modify, or add missing macronutrient values (protein, carbs, fat) or details to today's logs, use the 'updateLogEntry' tool using the corresponding ID listed in the log context.
`;

    // 3. Format history for Gemini API
    // The @google/genai SDK accepts history inside contents: [{ role: 'user', parts: [...] }, ...]
    // Max 10 previous messages for context length limits.
    const historyLimit = 10;
    const recentMessages = chat.messages.slice(-historyLimit - 1, -1); // Exclude the user message we just added

    const contents = [];
    
    // Add history in Gemini format
    for (const msg of recentMessages) {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.content }],
      });
    }

    // Add current user message with system context prepended
    contents.push({
      role: 'user',
      parts: [
        { text: `${context}\n\nUser Question: ${message}` }
      ],
    });

    const tools: any = [{
      functionDeclarations: [
        {
          name: 'logFood',
          description: 'Logs a food item or meal into the user\'s tracking database.',
          parameters: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING', description: 'Name of the food item or dish (e.g., 4 Chapatis with chicken curry)' },
              caloriesIn: { type: 'INTEGER', description: 'Estimated or specified calories in kcal' },
              mealType: { type: 'STRING', enum: ['breakfast', 'lunch', 'dinner', 'snack'], description: 'Category of the meal' },
              protein: { type: 'INTEGER', description: 'Estimated protein in grams (calculate based on nutrition database)' },
              carbs: { type: 'INTEGER', description: 'Estimated carbohydrates in grams (calculate based on nutrition database)' },
              fat: { type: 'INTEGER', description: 'Estimated fat in grams (calculate based on nutrition database)' },
              date: { type: 'STRING', description: 'Target date in YYYY-MM-DD format. Use yesterday\'s date if user refers to yesterday.' }
            },
            required: ['name', 'caloriesIn', 'mealType', 'protein', 'carbs', 'fat']
          }
        },
        {
          name: 'logWorkout',
          description: 'Logs a workout, walk, or exercise activity to the user\'s tracking database.',
          parameters: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING', description: 'Name of the activity or exercise (e.g., Walking 4623 steps)' },
              caloriesOut: { type: 'INTEGER', description: 'Estimated or specified calories burned' },
              duration: { type: 'INTEGER', description: 'Duration in minutes (optional)' },
              date: { type: 'STRING', description: 'Target date in YYYY-MM-DD format. Use yesterday\'s date if user refers to yesterday.' }
            },
            required: ['name', 'caloriesOut']
          }
        },
        {
          name: 'updateUserProfile',
          description: 'Saves user metrics (weight in kg, height in cm, age in years, gender, activity level, or direct daily targetCalories). All fields are optional to allow partial updates.',
          parameters: {
            type: 'OBJECT',
            properties: {
              weight: { type: 'NUMBER', description: 'Weight in kilograms (kg) (optional)' },
              height: { type: 'NUMBER', description: 'Height in centimeters (cm) (optional)' },
              age: { type: 'INTEGER', description: 'Age in years (optional)' },
              gender: { type: 'STRING', enum: ['male', 'female'], description: 'Gender of the user (optional)' },
              activityLevel: { type: 'STRING', enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'], description: 'Daily exercise/activity level (optional)' },
              targetCalories: { type: 'INTEGER', description: 'Custom daily calorie target requirement in kcal (e.g. 1710) (optional)' }
            }
          }
        },
        {
          name: 'updateLogEntry',
          description: 'Updates an existing log entry (food or workout) in the user\'s database using its Mongo ID. All parameter fields are optional to allow partial edits.',
          parameters: {
            type: 'OBJECT',
            properties: {
              id: { type: 'STRING', description: 'The MongoDB ObjectId of the log entry to update (e.g. 64b8a...)' },
              name: { type: 'STRING', description: 'Updated name of the item (optional)' },
              caloriesIn: { type: 'INTEGER', description: 'Updated calories in kcal for food (optional)' },
              caloriesOut: { type: 'INTEGER', description: 'Updated calories burned for workout (optional)' },
              protein: { type: 'INTEGER', description: 'Updated protein in grams for food (optional)' },
              carbs: { type: 'INTEGER', description: 'Updated carbs in grams for food (optional)' },
              fat: { type: 'INTEGER', description: 'Updated fat in grams for food (optional)' },
              duration: { type: 'INTEGER', description: 'Updated duration in minutes for workout (optional)' },
              mealType: { type: 'STRING', enum: ['breakfast', 'lunch', 'dinner', 'snack'], description: 'Updated meal category (optional)' },
              date: { type: 'STRING', description: 'Updated date in YYYY-MM-DD format (optional)' }
            },
            required: ['id']
          }
        },
        {
          name: 'addFitnessTask',
          description: 'Adds a daily fitness goal, task, or recurring healthy habit (todo item) to the user\'s checklist.',
          parameters: {
            type: 'OBJECT',
            properties: {
              text: { type: 'STRING', description: 'Description of the goal/task (e.g., Drink 3 liters of water, Buy protein powder)' },
              isRecurring: { type: 'BOOLEAN', description: 'Whether this is a recurring daily habit. Set true for recurring habits, false for one-off tasks.' },
              time: { type: 'STRING', description: 'Optional target time for the task in HH:MM format (e.g. 08:30 or 18:00) or general description (e.g. morning, evening).' },
              date: { type: 'STRING', description: 'Target date in YYYY-MM-DD format (optional, defaults to today)' }
            },
            required: ['text']
          }
        },
        {
          name: 'toggleFitnessTask',
          description: 'Updates completion status of a checklist goal/task using its ID.',
          parameters: {
            type: 'OBJECT',
            properties: {
              id: { type: 'STRING', description: 'The MongoDB ObjectId of the task entry to update (e.g. 64b8a...)' },
              completed: { type: 'BOOLEAN', description: 'Target completion status (true to check off, false to mark pending)' },
              dateStr: { type: 'STRING', description: 'The target completion date in YYYY-MM-DD format. Required if toggling a recurring daily habit.' }
            },
            required: ['id', 'completed']
          }
        }
      ]
    }];

    const response = await generateContentWithFallback({
      apiKey,
      contents: contents,
      config: {
        tools: tools,
      }
    });

    const functionCalls = response.functionCalls;
    let loggedMessages: string[] = [];

    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        if (call.name === 'logFood') {
          const args = call.args as any;
          const logDate = args.date ? new Date(args.date) : new Date();
          await Log.create({
            userId: user.userId,
            type: 'food',
            name: args.name,
            date: logDate,
            caloriesIn: args.caloriesIn,
            mealType: args.mealType || 'none',
            protein: args.protein || 0,
            carbs: args.carbs || 0,
            fat: args.fat || 0,
          });
          loggedMessages.push(`Logged food: "${args.name}" (${args.caloriesIn} kcal) under ${args.mealType} on ${logDate.toDateString()}`);
        } else if (call.name === 'logWorkout') {
          const args = call.args as any;
          const logDate = args.date ? new Date(args.date) : new Date();
          await Log.create({
            userId: user.userId,
            type: 'workout',
            name: args.name,
            date: logDate,
            caloriesOut: args.caloriesOut,
            duration: args.duration || 0,
          });
          loggedMessages.push(`Logged workout: "${args.name}" (burned ${args.caloriesOut} kcal) on ${logDate.toDateString()}`);
        } else if (call.name === 'updateUserProfile') {
          const args = call.args as any;
          
          const existingUser = await User.findById(user.userId);
          if (!existingUser) continue;

          const weight = args.weight !== undefined ? args.weight : existingUser.weight;
          const height = args.height !== undefined ? args.height : existingUser.height;
          const age = args.age !== undefined ? args.age : existingUser.age;
          const gender = args.gender !== undefined ? args.gender : existingUser.gender;
          const activityLevel = args.activityLevel !== undefined ? args.activityLevel : existingUser.activityLevel;

          let targetCal = existingUser.targetCalories || 2000;
          let bmrMessage = "";

          if (args.targetCalories !== undefined) {
            targetCal = args.targetCalories;
            bmrMessage = `. Custom daily target set to ${targetCal} kcal.`;
          } else if (weight && height && age && gender && gender !== 'none') {
            let bmr = 0;
            if (gender === 'male') {
              bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
            } else {
              bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
            }

            let factor = 1.2;
            const currentActivity = activityLevel !== 'none' ? activityLevel : 'sedentary';
            switch (currentActivity) {
              case 'sedentary': factor = 1.2; break;
              case 'light': factor = 1.375; break;
              case 'moderate': factor = 1.55; break;
              case 'active': factor = 1.725; break;
              case 'very_active': factor = 1.9; break;
            }

            targetCal = Math.round(bmr * factor);
            bmrMessage = `. Calculated BMR: ${Math.round(bmr)} kcal, setting daily target requirement to ${targetCal} kcal.`;
          }

          await User.findByIdAndUpdate(user.userId, {
            weight,
            height,
            age,
            gender,
            activityLevel,
            targetCalories: targetCal,
          });

          const updateLog = [];
          if (args.weight !== undefined) updateLog.push(`Weight: ${args.weight}kg`);
          if (args.height !== undefined) updateLog.push(`Height: ${args.height}cm`);
          if (args.age !== undefined) updateLog.push(`Age: ${args.age}`);
          if (args.gender !== undefined) updateLog.push(`Gender: ${args.gender}`);
          if (args.activityLevel !== undefined) updateLog.push(`Activity Level: ${args.activityLevel}`);
          if (args.targetCalories !== undefined) updateLog.push(`Target Calories: ${args.targetCalories} kcal`);

          loggedMessages.push(`Updated profile details (${updateLog.join(', ')})${bmrMessage}`);
        } else if (call.name === 'updateLogEntry') {
          const args = call.args as any;
          const updateFields: any = {};
          if (args.name !== undefined) updateFields.name = args.name;
          if (args.caloriesIn !== undefined) updateFields.caloriesIn = args.caloriesIn;
          if (args.caloriesOut !== undefined) updateFields.caloriesOut = args.caloriesOut;
          if (args.protein !== undefined) updateFields.protein = args.protein;
          if (args.carbs !== undefined) updateFields.carbs = args.carbs;
          if (args.fat !== undefined) updateFields.fat = args.fat;
          if (args.duration !== undefined) updateFields.duration = args.duration;
          if (args.mealType !== undefined) updateFields.mealType = args.mealType;
          if (args.date !== undefined) updateFields.date = new Date(args.date);

          const updatedLog = await Log.findOneAndUpdate(
            { _id: args.id, userId: user.userId },
            { $set: updateFields },
            { new: true }
          );

          if (updatedLog) {
            loggedMessages.push(`Updated log entry "${updatedLog.name}" (ID: ${args.id})`);
          } else {
            loggedMessages.push(`Failed to update log entry: ID ${args.id} not found.`);
          }
        } else if (call.name === 'addFitnessTask') {
          const args = call.args as any;
          const taskDate = args.date ? new Date(args.date + 'T12:00:00') : new Date();
          await Task.create({
            userId: user.userId,
            text: args.text,
            date: taskDate,
            isRecurring: !!args.isRecurring,
            time: args.time || '',
            completed: false,
            completedDates: [],
          });
          loggedMessages.push(`Added task: "${args.text}"${args.time ? ` scheduled for ${args.time}` : ''}`);
        } else if (call.name === 'toggleFitnessTask') {
          const args = call.args as any;
          const { id, completed, dateStr } = args;
          const task = await Task.findOne({ _id: id, userId: user.userId });
          if (task) {
            if (task.isRecurring) {
              const actualDateStr = dateStr || new Date().toLocaleDateString('en-CA');
              if (completed) {
                await Task.updateOne({ _id: id }, { $addToSet: { completedDates: actualDateStr } });
              } else {
                await Task.updateOne({ _id: id }, { $pull: { completedDates: actualDateStr } });
              }
            } else {
              await Task.updateOne({ _id: id }, { $set: { completed: completed } });
            }
            loggedMessages.push(`Toggled task "${task.text}" completion to ${completed}`);
          } else {
            loggedMessages.push(`Failed to toggle task: ID ${id} not found.`);
          }
        }
      }

      // Generate final conversational confirmation via Gemini
      const confirmationContents = [
        ...contents,
        {
          role: 'model',
          parts: [{ text: `I am logging the following items: ${loggedMessages.join(', ')}.` }]
        },
        {
          role: 'user',
          parts: [{ text: `System action completed. Items logged:\n${loggedMessages.join('\n')}\n\nPlease summarize the items you have successfully saved to the user's database.` }]
        }
      ];

      const followUpResponse = await generateContentWithFallback({
        apiKey,
        contents: confirmationContents,
      });

      const replyText = followUpResponse.text || `I have logged the items for you:\n${loggedMessages.join('\n')}`;

      chat.messages.push({ role: 'model', content: replyText, timestamp: new Date() });
      await chat.save();

      return NextResponse.json({
        message: {
          role: 'model',
          content: replyText,
          timestamp: new Date(),
        },
        dataUpdated: true
      });
    }

    const replyText = response.text || "I'm sorry, I encountered an issue processing your query.";

    // Save model response to DB
    chat.messages.push({ role: 'model', content: replyText, timestamp: new Date() });
    await chat.save();

    return NextResponse.json({
      message: {
        role: 'model',
        content: replyText,
        timestamp: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Chat Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    await connectToDatabase();

    // Clear chat history
    await Chat.findOneAndDelete({ userId: user.userId });
    return NextResponse.json({ message: 'Chat history cleared successfully' });
  } catch (error: any) {
    console.error('Clear Chat Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
