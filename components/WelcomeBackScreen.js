import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeBackScreen({ route, navigation }) {
  const { phone, name } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prevTimer => (prevTimer > 0 ? prevTimer - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const verifyOTP = async () => {
    const enteredOTP = otp.join('');
    if (enteredOTP.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
      return false;
    }

    if (enteredOTP !== '123456') {
      Alert.alert('Error', 'Invalid OTP. Please try again. Use: 123456');
      return false;
    }

    return true;
  };

  const handleVerify = async () => {
    const isOTPValid = await verifyOTP();
    if (!isOTPValid) return;

    setIsLoading(true);
    try {
      const userData = await AsyncStorage.getItem(phone);
      if (!userData) {
        throw new Error('User not found');
      }

      await AsyncStorage.setItem('isLoggedIn', 'true');
      navigation.reset({
        index: 0,
        routes: [{ name: 'OngoingPolls' }],
      });
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeText = (text, index) => {
    if (!/^\d*$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputsRef.current[index + 1].focus();
    }

    if (!text && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    } else if (e.nativeEvent.key === 'Enter' && index === 5) {
      handleVerify();
    }
  };

  const handleResendOTP = () => {
    setTimer(60);
    setOtp(['', '', '', '', '', '']);
    Alert.alert('OTP Sent', 'Use test OTP: 123456');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Hello {name} 👋</Text>
        <Text style={styles.subtitle}>Phone: {phone}</Text>

        <Text style={styles.otpLabel}>Enter 6-digit OTP</Text>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => (inputsRef.current[index] = ref)}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              selectTextOnFocus
              editable={!isLoading && !verificationLoading}
            />
          ))}
        </View>

        {timer > 0 ? (
          <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResendOTP} disabled={verificationLoading}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (isLoading || verificationLoading) && styles.buttonDisabled
          ]}
          onPress={handleVerify}
          disabled={isLoading || verificationLoading}
        >
          {(isLoading || verificationLoading) ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Proceed to Vote</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollContainer: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#3b82f6',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  otpLabel: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    height: 50,
    backgroundColor: 'white',
    textAlign: 'center',
    fontSize: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#9ac9f5',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  resendText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});