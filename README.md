# Smart Question Evaluator

Act as an Expert Full-Stack Software Architect and AI Engineer. I want to build a "Smart Exam Question Analyzer" web application. The application should allow educators or students to upload or paste exam questions, syllabus outlines, and rubrics, and then leverage AI to parse, categorize, and evaluate them.

Please design and generate the complete application structure (frontend, backend, and database schema) based on the following specifications:

1. Core Features & Capabilities:

   - Question Ingestion: Support multi-format inputs (PDF, text paste, image OCR for handwritten/printed question papers).

   - Bloom’s Taxonomy Classification: Automatically tag each question by cognitive level (Remember, Understand, Apply, Analyze, Evaluate, Create).

   - Difficulty & Quality Scoring: Evaluate questions for ambiguity, bias, expected time to solve, and estimated difficulty level (Easy, Medium, Hard).

   - Syllabus Mapping: Match questions against an uploaded curriculum/syllabus outline using text embeddings or semantic search to check coverage percentages.

   - Analytics Dashboard: Visual charts showing the distribution of cognitive levels, topic coverage gaps, and average difficulty breakdown.

2. Tech Stack Requirements:

   - Frontend: Clean, modern responsive dashboard using React/Next.js and Tailwind CSS with drag-and-drop file upload capability.

   - Backend: Python (FastAPI or Flask) for high-performance API routing and handling data parsing pipelines.

   - AI/ML Layer: Integration framework using LangChain or native LLM APIs to handle document parsing and structured JSON generation.

   - Database: PostgreSQL schema to store users, exam sets, parsed questions, and analysis metadata.

3. Deliverables Expected:

   - Step-by-step implementation plan (tasks.md structure).

   - Complete folder structure and code for key components (Parser module, Taxonomy Classifier, and Dashboard UI).

   - Instructions for local setup and environment variables configuration.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://question-insight-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/beefa093-e728-467f-8a9f-6360e9160b52).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
