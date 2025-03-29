import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { LineChart, BarChart } from 'react-native-chart-kit';

const AnalyticsScreen = ({ navigation }) => {
  // Define the accent color here so it's available within the component
  const ACCENT_COLOR = '#FFA500'; // Orange accent color to match your theme
  
  const [loading, setLoading] = useState(true);
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [adherenceRate, setAdherenceRate] = useState(0);
  const [medicationStats, setMedicationStats] = useState([]);
  const [timeOfDayData, setTimeOfDayData] = useState({
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0
  });
  const [weeklyData, setWeeklyData] = useState({
    labels: [],
    datasets: [{ data: [] }]
  });

  // Adjusted screen width to ensure chart fits inside the card
  const screenWidth = Dimensions.get('window').width - 60; 

  useEffect(() => {
    fetchMedicationAnalytics();
  }, []);

  // Format date as YYYY-MM-DD
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get last 30 days as array of dates
  const getLast30Days = () => {
    const result = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      result.push(formatDateString(date));
    }
    
    return result;
  };

  // Get last 7 days for weekly chart
  const getLast7Days = () => {
    const result = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      result.push(dayName);
    }
    
    return result;
  };

  // Determine time of day category
  const getTimeOfDay = (date) => {
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  // Fetch medication logs from Firestore and calculate analytics
  const fetchMedicationAnalytics = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('No authenticated user found');
        setLoading(false);
        return;
      }

      // Get 30 days ago timestamp for filtering
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);

      // Query logs from the last 30 days
      const logsRef = collection(db, 'users', userId, 'medicationLogs');
      const q = query(
        logsRef,
        where('takenAt', '>=', thirtyDaysAgoTimestamp),
        orderBy('takenAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const logs = [];
      const medicationFrequency = {};
      const timeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };
      const last30Days = getLast30Days();
      const daysWithLogs = new Set();
      const dailyCounts = Array(7).fill(0); // For weekly chart
      const weekdayLabels = getLast7Days();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        let takenAt = data.takenAt;

        // Parse Firestore timestamp correctly
        if (takenAt && takenAt.toDate) {
          takenAt = takenAt.toDate();
        } else if (typeof takenAt === 'string') {
          takenAt = new Date(takenAt);
        } else if (takenAt && takenAt.seconds) {
          takenAt = new Date(takenAt.seconds * 1000);
        }

        if (takenAt instanceof Date && !isNaN(takenAt)) {
          // Format date for analysis
          const dateString = formatDateString(takenAt);
          daysWithLogs.add(dateString);
          
          // Count medications by name
          if (!medicationFrequency[data.medicationName]) {
            medicationFrequency[data.medicationName] = 0;
          }
          medicationFrequency[data.medicationName]++;
          
          // Time of day analysis
          const timeCategory = getTimeOfDay(takenAt);
          timeOfDay[timeCategory]++;
          
          // Weekly analysis
          const dayOfWeekIndex = 6 - weekdayLabels.findIndex(
            day => day === takenAt.toLocaleDateString('en-US', { weekday: 'short' })
          );
          if (dayOfWeekIndex >= 0 && dayOfWeekIndex < 7) {
            dailyCounts[dayOfWeekIndex]++;
          }
          
          // Add to logs array
          logs.push({
            id: doc.id,
            ...data,
            takenAt,
            dateString,
          });
        }
      });

      // Calculate adherence rate (days with logs / 30 days)
      const adherencePercentage = (daysWithLogs.size / 30) * 100;
      
      // Convert medication frequency to sorted array
      const medicationStatsArray = Object.entries(medicationFrequency)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      
      // Set state with calculated data
      setMedicationLogs(logs);
      setAdherenceRate(adherencePercentage);
      setMedicationStats(medicationStatsArray);
      setTimeOfDayData(timeOfDay);
      setWeeklyData({
        labels: weekdayLabels,
        datasets: [{ data: dailyCounts }]
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching medication analytics:', error);
      setLoading(false);
    }
  };

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Summary Card - Reorganized with left-aligned Top Med */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>30-Day Summary</Text>
            <View style={styles.summaryContainerTopMed}>
              {/* Top Med is now left-aligned */}
              <View style={styles.summaryItemLeftAligned}>
                <Text style={[styles.summaryNumber, { color: ACCENT_COLOR }]}>
                  {medicationStats.length > 0 ? medicationStats[0].name.substring(0, 10) : 'N/A'}
                </Text>
                <Text style={styles.summaryLabel}>Top Med</Text>
              </View>
            </View>
            
            {/* Total Doses and Adherence Rate with 20px gap */}
            <View style={styles.secondarySummaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: ACCENT_COLOR }]}>{medicationLogs.length}</Text>
                <Text style={styles.summaryLabel}>Total Doses</Text>
              </View>
              {/* Empty View for spacing */}
              <View style={{width: 20}} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: ACCENT_COLOR }]}>{adherenceRate.toFixed(0)}%</Text>
                <Text style={styles.summaryLabel}>Adherence Rate</Text>
              </View>
            </View>
          </View>

          {/* Weekly Trend Chart - Properly centered in card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weekly Trend</Text>
            <Text style={styles.cardSubtitle}>Number of medications taken each day</Text>
            
            <View style={styles.chartContainer}>
              <BarChart
                data={weeklyData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                verticalLabelRotation={0}
                fromZero
              />
            </View>
          </View>

          {/* Time of Day Distribution */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Time of Day Distribution</Text>
            <Text style={styles.cardSubtitle}>When you typically take your medication</Text>
            
            <View style={styles.timeDistributionContainer}>
              {Object.entries(timeOfDayData).map(([time, count]) => (
                <View key={time} style={styles.timeDistItem}>
                  <View style={styles.timeBar}>
                    <View 
                      style={[
                        styles.timeBarFill, 
                        { 
                          height: `${Math.min(100, (count / Math.max(1, medicationLogs.length)) * 100)}%`,
                          backgroundColor: ACCENT_COLOR 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.timeLabel}>{time.charAt(0).toUpperCase() + time.slice(1)}</Text>
                  <Text style={styles.timeCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Top Medications */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top Medications</Text>
            <Text style={styles.cardSubtitle}>Most frequently taken medications</Text>
            
            {medicationStats.slice(0, 5).map((med, index) => (
              <View key={med.name} style={styles.medicationItem}>
                <View style={[styles.medicationRank, { backgroundColor: '#fff1e6', color: ACCENT_COLOR }]}>
                  <Text style={{ color: ACCENT_COLOR, fontWeight: 'bold' }}>{index + 1}</Text>
                </View>
                <Text style={styles.medicationName}>{med.name}</Text>
                <Text style={styles.medicationCount}>{med.count} doses</Text>
              </View>
            ))}
            
            {medicationStats.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No medication data available</Text>
              </View>
            )}
          </View>

          {/* Streak and Consistency */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Consistency Insights</Text>
            <View style={styles.insightContainer}>
              <View style={styles.insightItem}>
                <Ionicons name="trending-up" size={24} color={ACCENT_COLOR} />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>
                    {adherenceRate >= 80 ? "Great adherence!" : 
                     adherenceRate >= 50 ? "Good progress" : "Room for improvement"}
                  </Text>
                  <Text style={styles.insightText}>
                    You've taken your medication on {Math.round(adherenceRate)}% of days
                    in the last month.
                  </Text>
                </View>
              </View>
              
              {/* Added 20px margin-top gap here */}
              <View style={[styles.insightItem, styles.secondInsightItem]}>
                <Ionicons 
                  name={Object.entries(timeOfDayData).sort((a, b) => b[1] - a[1])[0][0] === 'morning' ? 
                        "sunny-outline" : 
                        Object.entries(timeOfDayData).sort((a, b) => b[1] - a[1])[0][0] === 'night' ? 
                        "moon-outline" : "partly-sunny-outline"} 
                  size={24} 
                  color={ACCENT_COLOR} 
                />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>
                    Preferred time: {Object.entries(timeOfDayData).sort((a, b) => b[1] - a[1])[0][0]}
                  </Text>
                  <Text style={styles.insightText}>
                    You most frequently take your medication during the {Object.entries(timeOfDayData).sort((a, b) => b[1] - a[1])[0][0]}.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  summaryContainerTopMed: {
    alignItems: 'flex-start', // Align Top Med to the left
    marginTop: 10,
    marginBottom: 20, // Space between Top Med and the row below
  },
  summaryItemLeftAligned: {
    alignItems: 'flex-start', // Left align the content
  },
  secondarySummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align to the left instead of space-between
    // No need for justifyContent: 'space-between' since we're using a spacer View
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  chartContainer: {
    alignItems: 'center', // Center horizontally in the card
    marginLeft: 0, // Reset any left margin to properly center
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  timeDistributionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    marginTop: 10,
  },
  timeDistItem: {
    alignItems: 'center',
    flex: 1,
  },
  timeBar: {
    width: 30,
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  timeBarFill: {
    width: '100%',
    borderRadius: 15,
  },
  timeLabel: {
    fontSize: 12,
    marginTop: 8,
    color: '#666',
  },
  timeCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicationRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff1e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  medicationName: {
    flex: 1,
    fontSize: 16,
  },
  medicationCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  insightContainer: {
    marginTop: 10,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  secondInsightItem: {
    marginTop: 20, // 20px gap as requested
  },
  insightContent: {
    marginLeft: 15,
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default AnalyticsScreen;