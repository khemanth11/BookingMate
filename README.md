# EverythingBooking 🚀

**EverythingBooking** is a comprehensive, full-stack service marketplace platform designed to bridge the gap between service providers and consumers. Built with a modern tech stack, it features real-time communication, AI-powered verification, and an intuitive mobile experience.

---

## ✨ Key Features

### 🛒 For Consumers
- **Smart Service Discovery**: Browse through diverse categories like Medical, Farm Equipment, Labor, and more.
- **AI-Powered Search**: Intelligent search functionality to find exactly what you need.
- **Interactive Map Integration**: Visualize service providers nearby for quick assistance.
- **Real-Time Chat**: Seamless communication with providers using WebSockets.
- **Instant Booking**: easy-to-use scheduling system with calendar integration.

### 🛠️ For Providers
- **Listing Management**: Effortlessly add, edit, and manage services.
- **AI Listing Optimizer**: Uses Generative AI to polish raw service descriptions into professional sales pitches.
- **Booking Dashboard**: Manage all incoming requests and track job statuses in real-time.

### 🛡️ Core Innovations
- **AI Image Verification**: Uses **Groq Vision AI (Llama 3.2)** to verify job completion through photos, ensuring trust and accountability.
- **Vector Search**: Integrated with **Pinecone** for high-performance, context-aware service matching.
- **Socket.io Integration**: Persistent, real-time messaging for a smooth user experience.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (Native Stack)
- **Real-time**: Socket.io-client
- **Storage**: AsyncStorage
- **Maps**: React Native Maps

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **AI Engines**: OpenAI API, Groq SDK (Llama 3.3 & Vision)
- **Vector Database**: Pinecone
- **Real-time**: Socket.io

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Expo CLI
- MongoDB

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/EverythingBooking.git
   cd EverythingBooking
   ```

2. **Backend Setup**
   ```bash
   cd Server
   npm install
   # Create a .env file and add your credentials (MONGODB_URI, GROQ_API_KEY, etc.)
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   npx expo start
   ```

---

## 📱 Screenshots & UI
The application features a premium, clean design with:
- **Glassmorphism-inspired components**
- **Elevated card layouts with subtle shadows**
- **Intuitive navigation patterns**

---

## 👨‍💻 Author
**Your Name**  
*Full Stack Developer*

---

> [!TIP]
> This project highlights skills in **Generative AI integration**, **Real-time systems**, and **Scalable Full-Stack Architecture**.
