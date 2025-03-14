import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false)

  const navigation = useNavigation();

  const handleSignIn = async () => {
    if (!email || !password) {
      alert('Please fill in both fields');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      //alert('Sign in successful!');
      navigation.navigate('HomeScreen'); // Navigate to HomeScreen 
    } catch (error) {
      alert("Sign-In Failed: " + error.message); // error message if sign-in fails
    }

    setLoading(false);
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUpScreen');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
      
      {/* back button */}
      <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.contentContainer}>
        
          <Text style={styles.title}>Sign In</Text>
          
          <Text style={styles.subtitle}>
            Welcome back! Sign-In using your credentials to keep track of your medications.
          </Text>
          
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={handleSignIn}
          >
            <Text style={styles.signInButtonText}>SIGN IN</Text>
          </TouchableOpacity>
          
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't Have an account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },

backButton: {
  padding: 8,
  borderRadius: 20,
  backgroundColor: '#f0f0f0',
},
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 36,
    marginBottom: 20,
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
    marginBottom: 60,
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
  },
  signInButton: {
    backgroundColor: '#888',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
  },
  signUpLink: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#4361ee',
  },
});

export default SignInPage;