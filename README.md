# 🌟 NSL Student Result Portal

[![Language](https://img.shields.io/badge/Language-Node.js-green.svg)](https://nodejs.org)
[![Framework](https://img.shields.io/badge/Framework-Express-lightgrey.svg)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://vercel.com)

A premium, responsive web application for students to securely access their academic results, profiles, and documents. Built with focus on speed, security, and seamless integration with Microsoft SharePoint.

---

## 🚀 Key Features

- **🔐 Secure Authentication**: Simple yet secure login using phone numbers with session-based persistence.
- **📊 Real-time Data**: Integrated with **Microsoft Graph API** to fetch student records directly from SharePoint lists.
- **📱 Premium Responsive UI**: Clean, mobile-first design using EJS templates and Inter typography.
- **📂 Document Access**: Direct links to student documents like CVs, Photos, and Videos.
- **🛠 Flexible Backend**: Supports both `Mock Data` mode for development and `Production` mode for live API integration.
- **☁️ Vercel Ready**: Pre-configured for seamless deployment to Vercel's serverless platform.

---

## 🛠 Tech Stack

- **Core**: Node.js, Express.js (v5+)
- **Templating**: EJS (Embedded JavaScript)
- **Authentication**: Express Session & Cookie Session
- **Integration**: Microsoft Graph API / Axios
- **Styling**: Vanilla CSS (Premium Design System)
- **Deployment**: Vercel

---

## 💻 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/nsl-portal.git
   cd nsl-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and copy the values from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Required variables:*
   - `USE_MOCK_DATA`: Set to `true` for development, `false` for SharePoint integration.
   - `SESSION_SECRET`: Random string for session encryption.
   - `ADMIN_PASSWORD`: Access code for administrative features.
   - `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`: Azure AD credentials for Microsoft Graph.

4. **Run the application**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 📁 Project Structure

```text
nsl-portal/
├── public/          # Static assets (CSS, Images)
├── views/           # EJS Template files (Login, Profile, 404)
├── server.js        # Main Express application logic
├── vercel.json      # Vercel deployment configuration
├── .env.example     # Template for environment variables
└── package.json     # Project dependencies and scripts
```

---

## ☁️ Deployment

### Deploy to Vercel

1. **Push your code to GitHub.**
2. **Connect to Vercel**: Import the repository on [Vercel Dashboard](https://vercel.com).
3. **Set Environment Variables**: Add all variables from your `.env` to the Vercel project settings.
4. **Deploy**: Vercel will automatically detect the configuration and deploy your app.

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 🤝 Contribution

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

*Built with ❤️ by [Your Name/Organization]*
