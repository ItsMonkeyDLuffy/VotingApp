import React, { useState, useEffect } from 'react';
import { View,Text, FlatList,TouchableOpacity,Modal,TextInput, StyleSheet,Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Animatable from 'react-native-animatable';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback,Keyboard,Platform } from 'react-native';


export default function OngoingPollsScreen({ navigation }) {
  const [polls, setPolls] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [numOptions, setNumOptions] = useState('');
  const [options, setOptions] = useState([]);
  const [pollDuration, setPollDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('hours');
  const [isLoading, setIsLoading] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const POLL_STORAGE_KEY = 'ONGOING_POLLS';

  useFocusEffect(
    React.useCallback(() => {
      const loadPolls = async () => {
        setIsLoading(true);
        try {
          const savedPolls = await AsyncStorage.getItem(POLL_STORAGE_KEY);
          if (savedPolls) {
            setPolls(JSON.parse(savedPolls));
          }
        } catch (error) {
          console.error('Error loading polls:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load polls',
          });
        } finally {
          setIsLoading(false);
        }
      };
      loadPolls();
    }, [])
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 15 }}>
          <TouchableOpacity
            onPress={() => setShowSearchBar(prev => !prev)}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="search" size={24} color="blue" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="blue" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          
          await AsyncStorage.removeItem('currentUser');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
        style: 'destructive',
      },
    ]);
  };

  const savePolls = async (pollsToSave) => {
    try {
      const jsonValue = JSON.stringify(pollsToSave);
      await AsyncStorage.setItem(POLL_STORAGE_KEY, jsonValue);
      console.log('Polls saved successfully');
    } catch (error) {
      console.error('Error saving polls:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save polls',
      });
      throw error;
    }
  };

  const handleAddPoll = async () => {
    const validOptions = options.filter(opt => opt && opt.trim() !== '');
    if (validOptions.length < 2) {
      Alert.alert('Invalid Poll', 'Please enter at least two options.');
      return;
    }
    if (!pollDuration || isNaN(Number(pollDuration))) {
      Alert.alert('Invalid Duration', 'Please enter a valid poll duration.');
      return;
    }

    const durationInMs =
      durationUnit === 'days'
        ? Number(pollDuration) * 24 * 60 * 60 * 1000
        : durationUnit === 'hours'
        ? Number(pollDuration) * 60 * 60 * 1000
        : Number(pollDuration) * 60 * 1000;

    const startTime = Date.now();
    const endTime = startTime + durationInMs;

    const poll = {
      title: newPollTitle.trim(),
      options: validOptions.map(option => ({ text: option.trim(), votes: 0 })),
      startTime,
      endTime,
    };

    const updatedPolls = [...polls, poll];
    setPolls(updatedPolls);
    await savePolls(updatedPolls);
    resetAddPollState();

    Toast.show({
      type: 'success',
      text1: 'Poll Created!',
      text2: 'Your new poll has been successfully created.',
    });
  };

  const resetAddPollState = () => {
    setShowAddDialog(false);
    setNewPollTitle('');
    setOptions([]);
    setNumOptions('');
    setPollDuration('');
    setDurationUnit('hours');
  };

  const handleDeletePoll = (index) => {
    Alert.alert('Delete Poll', 'Are you sure you want to delete this poll?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const updatedPolls = [...polls];
            updatedPolls.splice(index, 1);
            setPolls(updatedPolls);
            await savePolls(updatedPolls);
            Toast.show({
              type: 'success',
              text1: 'Poll Deleted!',
              text2: 'The selected poll has been successfully deleted.',
            });
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Failed to delete poll',
            });
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const formatTimeRemaining = (endTime) => {
    const remainingTime = endTime - Date.now();
    if (remainingTime <= 0) return 'Poll Closed';

    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const filteredPolls = polls.filter(poll =>
    poll.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPoll = ({ item, index }) => {
    const timeRemaining = formatTimeRemaining(item.endTime);
    const isPollClosed = item.endTime <= Date.now();

    return (
      <Animatable.View animation="fadeIn" duration={500} style={styles.pollCard}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => !isPollClosed && navigation.navigate('Vote', { poll: item })}
          disabled={isPollClosed}
        >
          <Text style={styles.pollTitle}>{item.title}</Text>
          <Text style={[styles.timeRemaining, isPollClosed && styles.closedPoll]}>
            {timeRemaining}
          </Text>
        </TouchableOpacity>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleDeletePoll(index)} style={{ marginRight: 8 }}>
            <Ionicons name="trash-outline" size={22} color="#e60000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('LiveResults', { poll: item })}>
            <Ionicons name="stats-chart-outline" size={22} color="#1e90ff" />
          </TouchableOpacity>
        </View>
      </Animatable.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
      {showSearchBar && (
        <View style={{ padding: 10 }}>
          <TextInput
            placeholder="Search polls..."
            value={searchQuery}
            onChangeText={text => {
              setSearchQuery(text);
              if (text.trim() === '') setShowSearchBar(false);
            }}
            style={[styles.input, { backgroundColor: '#fff' }]}
            autoFocus
          />
        </View>
      )}

      <TouchableOpacity style={styles.newPollButton} onPress={() => setShowAddDialog(true)}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.newPollButtonText}>New Poll</Text>
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading polls...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPolls}
          renderItem={renderPoll}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text>No polls available. Create one!</Text>
            </View>
          }
        />
      )}

      <Modal visible={showAddDialog} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.modalTitle}>Create New Poll</Text>
              <TouchableOpacity onPress={resetAddPollState}>
                <Ionicons name="close" size={28} color="black" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Poll Title"
              placeholderTextColor="#888"  
              value={newPollTitle}
              onChangeText={setNewPollTitle}
              style={styles.input}
              maxLength={100}
            />
            <TextInput
              placeholder="Number of options (2-10)"
              placeholderTextColor="#888"  
              value={numOptions}
              onChangeText={(text) => {
                const num = parseInt(text);
                if (isNaN(num)) {
                  setNumOptions('');
                  setOptions([]);
                } else if (num >= 2 && num <= 10) {
                  setNumOptions(text);
                  setOptions(Array(num).fill(''));
                }
              }}
              keyboardType="numeric"
              style={styles.input}
            />
            {Array.from({ length: Number(numOptions) || 0 }, (_, i) => (
              <TextInput
                key={i}
                placeholder={`Option ${i + 1}`}
                placeholderTextColor="#888"  // Add this
                value={options[i] || ''}
                onChangeText={(text) => {
                  const newOptions = [...options];
                  newOptions[i] = text;
                  setOptions(newOptions);
                }}
                style={styles.input}
                maxLength={50}
              />
            ))}
            <TextInput
              placeholder="Poll Duration"
              placeholderTextColor="#888" 
              value={pollDuration}
              onChangeText={setPollDuration}
              keyboardType="numeric"
              style={styles.input}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {['minutes', 'hours', 'days'].map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitButton, durationUnit === unit && { backgroundColor: 'blue' }]}
                  onPress={() => setDurationUnit(unit)}
                >
                  <Text style={{ color: 'white', textTransform: 'capitalize' }}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.addButton} onPress={handleAddPoll}>
              <Text style={{ color: 'white', textAlign: 'center' }}>Add Poll</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  pollCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pollTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  timeRemaining: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
  },
  closedPoll: {
    color: 'red',
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  unitButton: {
    backgroundColor: 'gray',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  newPollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
    padding: 12,
    margin: 20,
    borderRadius: 8,
    elevation: 3,
  },
  newPollButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
});