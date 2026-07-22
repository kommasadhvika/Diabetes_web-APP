import { db } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  console.log('Starting AI Diabetes Management System Database Seeding...');
  try {
    // 1. Seed Exercises
    const exercisesPath = path.join(__dirname, '../data/exercises.json');
    if (fs.existsSync(exercisesPath)) {
      const exercises = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));
      for (const exercise of exercises) {
        await db.collection('Exercises').doc(exercise.id).set(exercise);
      }
      console.log(`- Seeded ${exercises.length} Exercises.`);
    }

    // 2. Seed Foods
    const foodsPath = path.join(__dirname, '../data/foods.json');
    if (fs.existsSync(foodsPath)) {
      const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));
      for (const food of foods) {
        await db.collection('Foods').doc(food.id).set(food);
      }
      console.log(`- Seeded ${foods.length} Food items.`);
    }

    // 3. Seed Diet Templates
    const templatesPath = path.join(__dirname, '../data/dietTemplates.json');
    if (fs.existsSync(templatesPath)) {
      const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
      for (const key of Object.keys(templates)) {
        await db.collection('DietTemplates').doc(key).set(templates[key]);
      }
      console.log(`- Seeded ${Object.keys(templates).length} Diet Templates.`);
    }

    console.log('AI Diabetes Management System Database Seeding Completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
