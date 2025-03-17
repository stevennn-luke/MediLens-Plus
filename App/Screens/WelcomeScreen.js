import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  TouchableWithoutFeedback
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const [hasNavigated, setHasNavigated] = useState(false);
  const timeoutRef = useRef(null);
  
  // Function to clear all pending animations and timers
  const clearAllAnimations = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    titleOpacity.stopAnimation();
    subtitleOpacity.stopAnimation();
  };
  
  const navigateToHome = () => {
    if (!hasNavigated) {
      setHasNavigated(true);
      // Clear all pending animations before navigating
      clearAllAnimations();
      navigation.navigate('Welcome');
    }
  };
  
  useEffect(() => {
    // Animation fade in
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
        // fade out elements
        timeoutRef.current = setTimeout(() => {
          if (!hasNavigated) {
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
              navigateToHome();
            });
          }
        }, 2000);
      });
    });
    
    return () => {
      clearAllAnimations();
    };
  }, [hasNavigated]);
  
  return (
    <TouchableWithoutFeedback onPress={navigateToHome}>
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
            MediLens+
          </Animated.Text>
          <View style={styles.bottomTextContainer}>
            <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
              Managing medications should be effortless
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