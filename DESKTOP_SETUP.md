# Desktop App Setup Guide

This project has been pre-configured to build and run as a standalone Desktop application using Electron! 

Once you have exported and downloaded the ZIP file from AI Studio, follow these steps to run the app on your computer.

### Step 1: Install Requirements
1. Ensure you have **Node.js** installed on your computer. (Download it from https://nodejs.org/ if you don't).
2. Open your computer's terminal (Command Prompt on Windows, Terminal on Mac) and navigate to this extracted folder.
3. Run the following command to download the required libraries:
   `npm install`

### Step 2: Set up your API Key
Since this app is no longer running in the AI Studio cloud, it needs your personal API key to talk to the AI model.
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and generate an API key.
2. In this folder on your computer, open the `.env.example` file.
3. Rename the file to exactly `.env` (remove the `.example`).
4. Paste your API key into that file like this:
   `GEMINI_API_KEY=AIzaSy...your...key...here`

### Step 3: Test the Desktop App
Before packaging it into a real application, you can test it directly on your screen to ensure everything works!
Run this command in your terminal:
`npm run electron:dev`

This will compile the code, start the local server, and pop open the desktop window!

### Step 4: Build the Final Application
When you are happy with the app, you can compile it into a standard desktop executable (`.exe` on Windows, or `.dmg` / `.app` on Mac).
Run this command in your terminal:
`npm run electron:build`

Once it finishes, a new folder called `release/` will appear in your project. Inside that folder, you will find your fully packaged desktop application ready to use!
