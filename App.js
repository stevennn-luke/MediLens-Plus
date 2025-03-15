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
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import 'react-native-gesture-handler'; 

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
 