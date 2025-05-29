import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function LiveResultScreen({ route, navigation }) {
  const { poll: initialPoll } = route.params || {};
  const [poll, setPoll] = useState(initialPoll || null);
  const [votes, setVotes] = useState([]);
  const [isPollClosed, setIsPollClosed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [leadingOption, setLeadingOption] = useState('Calculating...');

  const voteIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const pollTitle = useRef(initialPoll?.title);

  const handleManualClose = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearInterval(countdownIntervalRef.current);
    clearInterval(voteIntervalRef.current);
    navigation.navigate('OngoingPolls');
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: '',
      headerBackVisible: false,
      headerRight: () => (
        <TouchableOpacity onPress={handleManualClose} style={{ marginRight: 15 }}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleManualClose]);

  const formatTimeRemaining = useCallback(() => {
    if (isPollClosed || !poll?.endTime) return 'Poll Closed';
    const remainingTime = poll.endTime - Date.now();
    if (remainingTime <= 0) return 'Poll Closed';
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s remaining`;
  }, [isPollClosed, poll]);

  const checkPollStatus = useCallback(() => {
    const currentTime = Date.now();
    setIsPollClosed(currentTime >= (poll?.endTime || 0));
  }, [poll]);

  const calculateLeadingOption = useCallback((currentVotes) => {
    if (!currentVotes.length) return 'No votes yet';
    const totalVotes = currentVotes.reduce((a, b) => a + b, 0);
    if (totalVotes === 0) return 'No votes yet';
    const leadingIndex = currentVotes.indexOf(Math.max(...currentVotes));
    return poll?.options?.[leadingIndex]?.text || 'No votes yet';
  }, [poll]);

  const fetchVotes = useCallback(async () => {
    try {
      const storedPolls = await AsyncStorage.getItem('ONGOING_POLLS');
      if (storedPolls) {
        const parsedPolls = JSON.parse(storedPolls);
        const currentPoll = parsedPolls.find(p => p.title === pollTitle.current);
        if (currentPoll) {
          const currentVotes = currentPoll.options.map(opt => opt.votes || 0);
          setVotes(currentVotes);
          setLeadingOption(calculateLeadingOption(currentVotes));
        }
      }
    } catch (err) {
      console.log('Error fetching votes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [calculateLeadingOption]);

  // 🔥 KEY FIX: safely handle missing poll/options without causing React warnings
  useEffect(() => {
    if (initialPoll && initialPoll.options && initialPoll.options.length > 0) {
      setPoll(initialPoll);
    } else {
      const timeout = setTimeout(() => {
        navigation.navigate('OngoingPolls');
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [initialPoll, navigation]);

  useEffect(() => {
    if (!poll) return;

    checkPollStatus();
    fetchVotes();

    if (!isPollClosed) {
      voteIntervalRef.current = setInterval(fetchVotes, 2000);
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          navigation.navigate('OngoingPolls');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      navigation.navigate('OngoingPolls');
    }, 10000);

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(countdownIntervalRef.current);
      clearInterval(voteIntervalRef.current);
    };
  }, [poll, isPollClosed, fetchVotes, checkPollStatus, navigation]);

  const renderOption = useCallback(({ item, index }) => {
    const voteCount = votes[index] || 0;
    const totalVotes = votes.reduce((a, b) => a + b, 0);
    const percentage = totalVotes === 0 ? 0 : (voteCount / totalVotes) * 100;
    const isLeading = item?.text === leadingOption && totalVotes > 0;

    return (
      <View style={styles.optionContainer}>
        <View style={styles.optionHeader}>
          <Text style={[styles.optionText, isLeading && styles.leadingOption]}>
            {item.text}
            {isLeading && <Ionicons name="trophy" size={16} color="gold" style={styles.trophyIcon} />}
          </Text>
          <Text style={styles.voteCount}>{voteCount} votes</Text>
        </View>
        <ProgressBar progress={percentage / 100} color={isLeading ? '#4CAF50' : '#2196F3'} style={styles.progressBar} />
        <Text style={styles.percentageText}>{percentage.toFixed(1)}%</Text>
      </View>
    );
  }, [votes, leadingOption]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Live Results</Text>
      <Text style={styles.pollTitle}>{poll?.title}</Text>

      <View style={styles.leadSection}>
        <Ionicons name="star" size={24} color="gold" />
        <Text style={styles.leadingOptionText}>
          Currently Leading: <Text style={styles.boldText}>{leadingOption}</Text>
        </Text>
      </View>

      <Text style={styles.timeRemaining}>{formatTimeRemaining()}</Text>

      <FlatList
        data={poll?.options}
        renderItem={renderOption}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      <Text style={styles.totalVotesText}>Total Votes: {votes.reduce((a, b) => a + b, 0)}</Text>
      <Text style={styles.countdownText}>Going to polls in {countdown} seconds...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f2' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#333' },
  pollTitle: { fontSize: 20, textAlign: 'center', marginBottom: 20, color: '#555' },
  optionContainer: { marginBottom: 20, backgroundColor: 'white', padding: 15, borderRadius: 8, elevation: 2 },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  optionText: { fontSize: 18, fontWeight: '600', flex: 1 },
  leadingOption: { color: '#4CAF50', fontWeight: 'bold' },
  voteCount: { fontSize: 16, color: '#666' },
  trophyIcon: { marginLeft: 5 },
  progressBar: { height: 12, borderRadius: 6, marginVertical: 5 },
  percentageText: { fontSize: 14, textAlign: 'right', color: '#555' },
  totalVotesText: { textAlign: 'center', marginTop: 10, fontSize: 18, fontWeight: 'bold', color: '#333' },
  leadSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, justifyContent: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8 },
  leadingOptionText: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  boldText: { fontWeight: 'bold', color: 'blue' },
  timeRemaining: { textAlign: 'center', fontSize: 16, marginBottom: 15, color: '#E91E63', fontWeight: 'bold' },
  countdownText: { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 16 },
});
