# TRADE.AI Platform

A personalized skilled trades career pathway platform that helps users discover intelligent pathways into meaningful, skilled work without incurring massive student debt.

## Features

- Personalized career recommendations based on user preferences
- Comprehensive career exploration for skilled trades
- Skills tracking and learning resources
- Career path visualization
- No authentication required for easy access

## Project Structure

```
trade-ai/
├── firebase.json        # Firebase configuration
├── firestore.rules      # Firestore security rules
├── firestore-data.json  # Sample data for Firestore import
├── functions/           # Cloud Functions for Firebase
│   ├── index.js         # AI recommendation system
│   └── package.json     # Functions dependencies
└── public/              # Static web assets
    ├── index.html       # Main HTML file
    ├── styles.css       # Custom CSS styles
    └── bundle.js        # Application JavaScript
```

## Deployment Instructions

### Prerequisites

1. Install Node.js and npm (https://nodejs.org/)
2. Install Firebase CLI:
   ```
   npm install -g firebase-tools
   ```
3. Login to Firebase:
   ```
   firebase login
   ```

### Steps to Deploy

1. Create a new Firebase project at https://console.firebase.google.com/

2. Update the `.firebaserc` file with your Firebase project ID:
   ```json
   {
     "projects": {
       "default": "YOUR-PROJECT-ID"
     }
   }
   ```

3. Deploy Firestore security rules and indexes:
   ```
   firebase deploy --only firestore
   ```

4. Import sample data to Firestore:
   - Go to Firebase Console > Firestore Database
   - Use the import functionality to upload the `firestore-data.json` file

5. Deploy Cloud Functions:
   ```
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

6. Deploy the web application:
   ```
   firebase deploy --only hosting
   ```

7. Access your deployed application at the URL provided after deployment completes.

## Local Development

1. Install dependencies:
   ```
   cd functions
   npm install
   ```

2. Start Firebase emulators:
   ```
   firebase emulators:start
   ```

3. Access the local development server at http://localhost:5000

## Testing

The application can be tested by:
1. Accessing the deployed or local application
2. Testing the personalization flow by selecting interests
3. Exploring career recommendations
4. Tracking skills progress (saved in localStorage)
5. Viewing career details and path visualizations
