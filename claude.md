# NSL Student Result Portal - Development Plan

## Overview
Build a student portal for NSL where students enter their phone number to see their profile and scores.

## Tech Stack
- **Backend**: Node.js, Express
- **Templating**: EJS
- **Session**: express-session
- **Integration**: Microsoft Graph API (SharePoint)
- **Environment**: dotenv

## Implementation Steps
1. **Setup**: Initialize project and install dependencies.
2. **Configuration**: Set up environment variables for mock and production modes.
3. **Core Logic**: Develop `server.js` with session management and student lookup logic.
4. **Graph Integration**: Implement OAuth2 flow and SharePoint list fetching.
5. **Frontend**: Create clean, responsive views using EJS.
6. **Validation**: Test mock data flow and session persistence.

## Design Specs
- **Colors**: Navy (#1a3c6e), Gray (#888, #f5f5f5), Green (#27ae60).
- **Typography**: Inter (Google Fonts).
- **Layout**: Centered cards, responsive grids.
