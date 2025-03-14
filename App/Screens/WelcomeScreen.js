import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Animated, 
  TouchableWithoutFeedback 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
//import WelcomeScreenMain from './App/Screens/WelcomeScreenMain';

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  
  
  const navigateToHome = () => {
    navigation.navigate('Welcome');
  };

  useEffect(() => {
    // Animattion fade in
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      // animate subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        //   fade out elements
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(titleOpacity, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(subtitleOpacity, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]).start(() => {
            navigation.navigate('Welcome');
          });
        }, 2000); 
      });
    });
  }, []);

  return (
    <TouchableWithoutFeedback onPress={navigateToHome}>
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
            MediLens+
          </Animated.Text>
          <View style={styles.bottomTextContainer}>
            <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
              To help with keeping track of your medications
            </Animated.Text>
          </View>
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 40,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  bottomTextContainer: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default WelcomeScreen;
