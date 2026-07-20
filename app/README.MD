# Abhyas Assessment - React Native Mobile App

This is the mobile student portal app for the Abhyas Assessment Platform, built with **React Native** and **Expo Go (JavaScript)**.

It replicates all student features from the web application:
- **Dashboard**: Streak cell logs, daily study counts, stats grids, and upcoming schedules.
- **Course Catalog**: Browse courses, search with autocomplete filters, paginate catalog cards, view course structures, and self-enroll.
- **Course Syllabus Player**: View article notes, mark lessons complete, track progress, save custom study notes, and launch quizzes.
- **My Exams & History**: Separate panels listing active tests and past completion percentages.
- **Exam Console**: Full-fledged exam simulator displaying active countdown timer, mark-for-review bookmarks, questions index selectors, and radio inputs.
- **Result Analytics**: Detailed answer breakdown comparing student choices with correct selections, listing solution explanations.
- **Leaderboard**: Student scoreboards matching global ranks.
- **Profile Configuration**: Edit student metadata, change security credentials, and dynamically customize host connections.

---

## Getting Started

### 1. Prerequisite
- Install **Expo Go** on your physical iOS/Android device from the Apple App Store or Google Play Store.

### 2. Startup Server configuration
Since the app runs on a mobile device or virtual emulator:
1. Ensure your computer and physical phone are connected to the **same Wi-Fi network**.
2. Identify your local computer network IP (e.g. `192.168.1.15` on Windows run `ipconfig`).
3. Launch the app (see below), and on the **Sign In Screen**, tap **Show API Config**.
4. Set the **Backend API Endpoint URL** pointing to your host IP:
   ```text
   http://192.168.1.15:5000/api
   ```
   *(Note: The Android Emulator automatically loops to the host computer using `http://10.0.2.2:5000/api`, which is configured as the default.)*

### 3. Launching the App
Run the following commands inside the `app` directory:
```bash
# Start Expo bundler
npm start
```
A QR code will be generated in your terminal:
- **Android**: Open the **Expo Go** app and tap "Scan QR Code".
- **iOS**: Open your default **Camera App**, scan the QR code, and open the link in Expo Go.

---

## Credentials for Testing
You can use the seeded database credentials to log in:
- **Email**: `student1@abhyas.com`
- **Password**: `student123`
- **Alternative Email**: `student2@abhyas.com`
- **Password**: `password123`