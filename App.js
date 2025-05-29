import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { enableScreens } from 'react-native-screens';
enableScreens();
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import WelcomeBackScreen from './components/WelcomeBackScreen';
import VotingScreen from './components/VotingScreen';
import OngoingPollsScreen from './components/OngoingPollsScreen';
import LiveResultScreen from './components/LiveResultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const phoneNumber = await AsyncStorage.getItem('USER_PHONE_NUMBER');
        if (phoneNumber) {
          setInitialRoute('OngoingPolls');
        } else {
          setInitialRoute('Login');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setInitialRoute('Login');
      }
    };

    checkLoginStatus();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: true }} 
        />
        <Stack.Screen 
          name="WelcomeBack" 
          component={WelcomeBackScreen} 
          options={{ headerShown: true }} 
        />
        <Stack.Screen 
          name="OngoingPolls" 
          component={OngoingPollsScreen} 
          options={{ 
            headerShown: true, 
            headerTitle: 'Ongoing Polls',
            headerBackVisible: false
          }} 
        />
        <Stack.Screen 
          name="Vote" 
          component={VotingScreen} 
          options={{
            headerShown: true,
            headerTitle: 'Cast Your Vote',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen 
          name="LiveResults" 
          component={LiveResultScreen} 
          options={({ navigation }) => ({
            headerShown: true,
            headerTitle: 'Live Results',
            headerBackVisible: false,
            headerRight: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('OngoingPolls')}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
