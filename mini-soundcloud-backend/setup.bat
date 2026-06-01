@echo off
echo 🎵 Setting up Mini SoundCloud...

REM Backend
mkdir mini-soundcloud-backend\src\config 2>nul
mkdir mini-soundcloud-backend\src\middleware 2>nul
mkdir mini-soundcloud-backend\src\routes 2>nul
cd mini-soundcloud-backend
call npm install
cd ..

REM Frontend
call npx create-expo-app mini-soundcloud-app --template blank
cd mini-soundcloud-app
call npm install @react-native-async-storage/async-storage @react-navigation/bottom-tabs @react-navigation/native @react-navigation/native-stack axios expo-av expo-document-picker expo-file-system expo-image-picker expo-web-browser expo-auth-session expo-crypto react-native-safe-area-context react-native-screens react-native-gesture-handler @supabase/supabase-js
cd ..

echo ✅ Setup xong! Chạy backend: cd mini-soundcloud-backend ^&^& npm run dev
echo ✅ Chạy frontend: cd mini-soundcloud-app ^&^& npx expo start
pause