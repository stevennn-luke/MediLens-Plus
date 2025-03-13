import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase"; 

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigation = useNavigation();


  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }
  
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
  
    setLoading(true);
  
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      //alert('Check your emails!');
      // Only navigate to ProfileScreen if sign-up was successful and email does not already exist
      navigation.navigate('ProfileScreen');
    } catch (error) {
      // Check if the error is because of the email already being in use
      if (error.code === 'auth/email-already-in-use') {
        alert('The email address is already in use. Please use a different email.');
      } else {
        alert("SignUp Failed: " + error.message);
      }
    }
  
    setLoading(false);
  };

  const handleSignIn = () => {
    // Navigate to the HomeScreenPage
    navigation.navigate('SignInPage');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>
            Join MediLens+ to keep track of your medications.
          </Text>
          
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={handleSignUp}
          >
            <Text style={styles.signUpButtonText}>SIGN IN</Text>
          </TouchableOpacity>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Have an account? </Text>
            <TouchableOpacity onPress={handleSignIn}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.termsText}>
            By creating an account, I accept MediLens+{' '}       
            </Text>
            <Text 
              style={styles.termsLink}
              onPress={() => navigation.navigate('Terms')}
            >
              Terms of Service.
          </Text>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 30,
    fontWeight: '300',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 36,
    marginBottom: 10,
    fontWeight: 'bold'
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
    marginBottom: 40,
    lineHeight: 24,
  },
  formContainer: {
    paddingVertical: 20,
    marginBottom: 30,
  },
  input: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },

  signUpButton: {
    backgroundColor: '#888',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    paddingTop: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#333',
  },
  loginLink: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  termsText: {
    paddingTop: 30,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 20,
  },
  termsLink: {  
    paddingVertical: 10,
    textAlign: 'center',
    color: '#333',
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;