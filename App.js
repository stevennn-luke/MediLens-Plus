import { StatusBar } from 'expo-status-bar';
import { StyleSheet, 
  Text, 
  View, 
  Image, 
  SafeAreaView,
 } from 'react-native';

import WelcomeScreen from './App/Screens/WelcomeScreen';
import WelcomeScreenMain from './App/Screens/WelcomeScreenMain';
import SignInPage from './App/Screens/SignInScreen';
import ForgotPasswordScreen from './App/Screens/ForgotPasswordScreen';
import SignUpScreen from './App/Screens/SignUpScreem';
import ProfileScreen from './App/Screens/ProfileScreen';
import MedicalIDScreen from './App/Screens/Medical-Id-Screem';
import HomeScreen from './App/Screens/Home-Screen';
import MedTrack from './App/Screens/Med-Track-Screen';
import AddMedicationScreen from './App/Screens/AddMedicationScreen';
import ActualProfile from './App/Screens/ActualProfileScreen';
import OCRScreen from './App/OCR/OCRScreen';
import CalendarScreen from './App/Screens/CalendarScreen';
import AnalyticsScreen from './App/Screens/AnalyticsScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import 'react-native-gesture-handler'; 
import MediVision from './App/OCR/MediVision';

const Stack = createNativeStackNavigator();

export default function App() {
  console.log("App Started")
  return (
   
   <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreenMain} />
        <Stack.Screen name="SignInPage" component={SignInPage} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /> 
        <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} /> 
        <Stack.Screen name="MedicalIDScreen" component={MedicalIDScreen} />  
        <Stack.Screen name="MedTrack" component={MedTrack} />  
        <Stack.Screen name="AddMed" component={AddMedicationScreen} /> 
        <Stack.Screen name="ActualProfile" component={ActualProfile} />
        <Stack.Screen name="OCRScreen" component={OCRScreen} /> 
        <Stack.Screen name="MediVision" component={MediVision} /> 
        <Stack.Screen name="CalendarScreen" component={CalendarScreen} /> 
        <Stack.Screen name="AnalyticsScreen" component={AnalyticsScreen} /> 
      </Stack.Navigator>
    </NavigationContainer>
    
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
 