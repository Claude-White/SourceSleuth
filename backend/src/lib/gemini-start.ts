import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';


dotenv.config();

const genAi = new GoogleGenerativeAI(process.env.API_KEY as string);