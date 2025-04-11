import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Card, Button, Icon, Divider } from 'react-native-elements';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import firebaseAnalyticsService from '../../services/firebase-analytics.service';
import { createHeaderAccessibilityProps } from '../../utils/accessibility';

// Screen width for responsive charts
const screenWidth = Dimensions.get('window').width;

// Date range options
enum DateRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom',
}

// Chart type options
enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
}

// Metric type options
enum MetricType {
  SCREEN_VIEWS = 'screen_views',
  CONSENT_CHANGES = 'consent_changes',
  DATA_EXPORTS = 'data_exports',
  ACCOUNT_ACTIONS = 'account_actions',
}

/**
 * Privacy Analytics Dashboard Component
 * 
 * This component displays analytics data for privacy features with
 * interactive charts, filtering options, and date range selection.
 */
const PrivacyAnalyticsDashboard: React.FC = () => {
  // State for date range
  const [dateRange, setDateRange] = useState<DateRange>(DateRange.WEEK);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  
  // State for chart type
  const [chartType, setChartType] = useState<Record<MetricType, ChartType>>({
    [MetricType.SCREEN_VIEWS]: ChartType.LINE,
    [MetricType.CONSENT_CHANGES]: ChartType.BAR,
    [MetricType.DATA_EXPORTS]: ChartType.PIE,
    [MetricType.ACCOUNT_ACTIONS]: ChartType.BAR,
  });
  
  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, startDate, endDate]);
  
  // Function to load analytics data
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get date range parameters
      const dateParams = getDateRangeParams();
      
      // In a real implementation, this would call the Firebase Analytics API
      // For this example, we'll use mock data
      const data = await getMockAnalyticsData(dateParams.start, dateParams.end);
      
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Function to get date range parameters
  const getDateRangeParams = () => {
    switch (dateRange) {
      case DateRange.DAY:
        return {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
        };
      case DateRange.WEEK:
        return {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
        };
      case DateRange.MONTH:
        return {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
        };
      case DateRange.CUSTOM:
        return {
          start: startDate,
          end: endDate,
        };
      default:
        return {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
        };
    }
  };
  
  // Function to get mock analytics data
  const getMockAnalyticsData = async (start: Date, end: Date) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate dates between start and end
    const dates = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Generate mock data
    return {
      screenViews: {
        labels: dates.map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [
          {
            data: dates.map(() => Math.floor(Math.random() * 100) + 20),
            color: (opacity = 1) => `rgba(255, 0, 110, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ['Screen Views'],
      },
      consentChanges: {
        labels: ['Enabled', 'Disabled'],
        datasets: [
          {
            data: [
              Math.floor(Math.random() * 50) + 10,
              Math.floor(Math.random() * 30) + 5,
            ],
          },
        ],
      },
      dataExports: {
        labels: ['Profile', 'Messages', 'Matches', 'Activity'],
        data: [
          Math.floor(Math.random() * 30) + 10,
          Math.floor(Math.random() * 20) + 5,
          Math.floor(Math.random() * 15) + 5,
          Math.floor(Math.random() * 10) + 2,
        ],
        colors: [
          '#FF006E',
          '#8338EC',
          '#3A86FF',
          '#FB5607',
        ],
      },
      accountActions: {
        labels: ['Deletion', 'Anonymization'],
        datasets: [
          {
            data: [
              Math.floor(Math.random() * 10) + 1,
              Math.floor(Math.random() * 5) + 1,
            ],
          },
        ],
      },
      topMetrics: {
        totalScreenViews: Math.floor(Math.random() * 1000) + 200,
        totalConsentChanges: Math.floor(Math.random() * 100) + 20,
        totalDataExports: Math.floor(Math.random() * 50) + 10,
        totalAccountActions: Math.floor(Math.random() * 20) + 5,
      },
    };
  };
  
  // Handle date range change
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    
    // Reset custom dates if not custom range
    if (range !== DateRange.CUSTOM) {
      const { start, end } = getDateRangeParams();
      setStartDate(start);
      setEndDate(end);
    }
  };
  
  // Handle start date change
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };
  
  // Handle end date change
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };
  
  // Handle chart type change
  const handleChartTypeChange = (metric: MetricType, type: ChartType) => {
    setChartType(prevState => ({
      ...prevState,
      [metric]: type,
    }));
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalyticsData();
  };
  
  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF006E" />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
      </View>
    );
  }
  
  // Render error state
  if (error && !analyticsData) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" type="feather" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Try Again"
          onPress={loadAnalyticsData}
          buttonStyle={styles.retryButton}
        />
      </View>
    );
  }
  
  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      {...createHeaderAccessibilityProps('Privacy Analytics Dashboard')}
    >
      <Text style={styles.title}>Privacy Analytics Dashboard</Text>
      
      {/* Date Range Selector */}
      <Card containerStyle={styles.card}>
        <Card.Title>Date Range</Card.Title>
        <View style={styles.dateRangeButtons}>
          <TouchableOpacity
            style={[
              styles.dateRangeButton,
              dateRange === DateRange.DAY && styles.dateRangeButtonActive,
            ]}
            onPress={() => handleDateRangeChange(DateRange.DAY)}
            accessible={true}
            accessibilityLabel="Last 24 hours"
            accessibilityRole="button"
            accessibilityState={{ selected: dateRange === DateRange.DAY }}
          >
            <Text
              style={[
                styles.dateRangeButtonText,
                dateRange === DateRange.DAY && styles.dateRangeButtonTextActive,
              ]}
            >
              Day
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.dateRangeButton,
              dateRange === DateRange.WEEK && styles.dateRangeButtonActive,
            ]}
            onPress={() => handleDateRangeChange(DateRange.WEEK)}
            accessible={true}
            accessibilityLabel="Last 7 days"
            accessibilityRole="button"
            accessibilityState={{ selected: dateRange === DateRange.WEEK }}
          >
            <Text
              style={[
                styles.dateRangeButtonText,
                dateRange === DateRange.WEEK && styles.dateRangeButtonTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.dateRangeButton,
              dateRange === DateRange.MONTH && styles.dateRangeButtonActive,
            ]}
            onPress={() => handleDateRangeChange(DateRange.MONTH)}
            accessible={true}
            accessibilityLabel="Last 30 days"
            accessibilityRole="button"
            accessibilityState={{ selected: dateRange === DateRange.MONTH }}
          >
            <Text
              style={[
                styles.dateRangeButtonText,
                dateRange === DateRange.MONTH && styles.dateRangeButtonTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.dateRangeButton,
              dateRange === DateRange.CUSTOM && styles.dateRangeButtonActive,
            ]}
            onPress={() => handleDateRangeChange(DateRange.CUSTOM)}
            accessible={true}
            accessibilityLabel="Custom date range"
            accessibilityRole="button"
            accessibilityState={{ selected: dateRange === DateRange.CUSTOM }}
          >
            <Text
              style={[
                styles.dateRangeButtonText,
                dateRange === DateRange.CUSTOM && styles.dateRangeButtonTextActive,
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>
        
        {dateRange === DateRange.CUSTOM && (
          <View style={styles.customDateContainer}>
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerLabel}>Start Date:</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>
                  {startDate.toLocaleDateString()}
                </Text>
                <Icon name="calendar" type="feather" size={16} color="#666" />
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={handleStartDateChange}
                  maximumDate={endDate}
                />
              )}
            </View>
            
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerLabel}>End Date:</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>
                  {endDate.toLocaleDateString()}
                </Text>
                <Icon name="calendar" type="feather" size={16} color="#666" />
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={handleEndDateChange}
                  minimumDate={startDate}
                  maximumDate={new Date()}
                />
              )}
            </View>
            
            <Button
              title="Apply"
              onPress={loadAnalyticsData}
              buttonStyle={styles.applyButton}
              disabled={startDate > endDate}
            />
          </View>
        )}
      </Card>
      
      {/* Top Metrics */}
      <Card containerStyle={styles.card}>
        <Card.Title>Key Metrics</Card.Title>
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {analyticsData?.topMetrics.totalScreenViews}
            </Text>
            <Text style={styles.metricLabel}>Screen Views</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {analyticsData?.topMetrics.totalConsentChanges}
            </Text>
            <Text style={styles.metricLabel}>Consent Changes</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {analyticsData?.topMetrics.totalDataExports}
            </Text>
            <Text style={styles.metricLabel}>Data Exports</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {analyticsData?.topMetrics.totalAccountActions}
            </Text>
            <Text style={styles.metricLabel}>Account Actions</Text>
          </View>
        </View>
      </Card>
      
      {/* Screen Views Chart */}
      <Card containerStyle={styles.card}>
        <Card.Title>Privacy Screen Views</Card.Title>
        <View style={styles.chartTypeButtons}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType[MetricType.SCREEN_VIEWS] === ChartType.LINE && styles.chartTypeButtonActive,
            ]}
            onPress={() => handleChartTypeChange(MetricType.SCREEN_VIEWS, ChartType.LINE)}
          >
            <Icon
              name="trending-up"
              type="feather"
              size={16}
              color={chartType[MetricType.SCREEN_VIEWS] === ChartType.LINE ? '#fff' : '#666'}
            />
            <Text
              style={[
                styles.chartTypeButtonText,
                chartType[MetricType.SCREEN_VIEWS] === ChartType.LINE && styles.chartTypeButtonTextActive,
              ]}
            >
              Line
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType[MetricType.SCREEN_VIEWS] === ChartType.BAR && styles.chartTypeButtonActive,
            ]}
            onPress={() => handleChartTypeChange(MetricType.SCREEN_VIEWS, ChartType.BAR)}
          >
            <Icon
              name="bar-chart-2"
              type="feather"
              size={16}
              color={chartType[MetricType.SCREEN_VIEWS] === ChartType.BAR ? '#fff' : '#666'}
            />
            <Text
              style={[
                styles.chartTypeButtonText,
                chartType[MetricType.SCREEN_VIEWS] === ChartType.BAR && styles.chartTypeButtonTextActive,
              ]}
            >
              Bar
            </Text>
          </TouchableOpacity>
        </View>
        
        {chartType[MetricType.SCREEN_VIEWS] === ChartType.LINE ? (
          <LineChart
            data={analyticsData?.screenViews}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            fromZero
            yAxisSuffix=""
            yAxisInterval={1}
            verticalLabelRotation={30}
            horizontalLabelRotation={-45}
            withInnerLines={false}
            withOuterLines={true}
            withDots={true}
            withShadow={false}
            segments={4}
            accessible={true}
            accessibilityLabel="Line chart showing privacy screen views over time"
          />
        ) : (
          <BarChart
            data={analyticsData?.screenViews}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            yAxisSuffix=""
            verticalLabelRotation={30}
            horizontalLabelRotation={-45}
            withInnerLines={false}
            segments={4}
            accessible={true}
            accessibilityLabel="Bar chart showing privacy screen views over time"
          />
        )}
      </Card>
      
      {/* Consent Changes Chart */}
      <Card containerStyle={styles.card}>
        <Card.Title>Consent Changes</Card.Title>
        <View style={styles.chartTypeButtons}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType[MetricType.CONSENT_CHANGES] === ChartType.BAR && styles.chartTypeButtonActive,
            ]}
            onPress={() => handleChartTypeChange(MetricType.CONSENT_CHANGES, ChartType.BAR)}
          >
            <Icon
              name="bar-chart-2"
              type="feather"
              size={16}
              color={chartType[MetricType.CONSENT_CHANGES] === ChartType.BAR ? '#fff' : '#666'}
            />
            <Text
              style={[
                styles.chartTypeButtonText,
                chartType[MetricType.CONSENT_CHANGES] === ChartType.BAR && styles.chartTypeButtonTextActive,
              ]}
            >
              Bar
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType[MetricType.CONSENT_CHANGES] === ChartType.PIE && styles.chartTypeButtonActive,
            ]}
            onPress={() => handleChartTypeChange(MetricType.CONSENT_CHANGES, ChartType.PIE)}
          >
            <Icon
              name="pie-chart"
              type="feather"
              size={16}
              color={chartType[MetricType.CONSENT_CHANGES] === ChartType.PIE ? '#fff' : '#666'}
            />
            <Text
              style={[
                styles.chartTypeButtonText,
                chartType[MetricType.CONSENT_CHANGES] === ChartType.PIE && styles.chartTypeButtonTextActive,
              ]}
            >
              Pie
            </Text>
          </TouchableOpacity>
        </View>
        
        {chartType[MetricType.CONSENT_CHANGES] === ChartType.BAR ? (
          <BarChart
            data={analyticsData?.consentChanges}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(131, 56, 236, ${opacity})`,
            }}
            style={styles.chart}
            fromZero
            yAxisSuffix=""
            segments={4}
            accessible={true}
            accessibilityLabel="Bar chart showing consent changes"
          />
        ) : (
          <PieChart
            data={[
              {
                name: 'Enabled',
                population: analyticsData?.consentChanges.datasets[0].data[0],
                color: '#8338EC',
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
              },
              {
                name: 'Disabled',
                population: analyticsData?.consentChanges.datasets[0].data[1],
                color: '#FF006E',
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
              },
            ]}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            accessible={true}
            accessibilityLabel="Pie chart showing consent changes"
          />
        )}
      </Card>
      
      {/* Data Exports Chart */}
      <Card containerStyle={styles.card}>
        <Card.Title>Data Exports by Category</Card.Title>
        <PieChart
          data={analyticsData?.dataExports.labels.map((label: string, index: number) => ({
            name: label,
            population: analyticsData?.dataExports.data[index],
            color: analyticsData?.dataExports.colors[index],
            legendFontColor: '#7F7F7F',
            legendFontSize: 12,
          }))}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          accessible={true}
          accessibilityLabel="Pie chart showing data exports by category"
        />
      </Card>
      
      {/* Account Actions Chart */}
      <Card containerStyle={styles.card}>
        <Card.Title>Account Actions</Card.Title>
        <BarChart
          data={analyticsData?.accountActions}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(58, 134, 255, ${opacity})`,
          }}
          style={styles.chart}
          fromZero
          yAxisSuffix=""
          segments={4}
          accessible={true}
          accessibilityLabel="Bar chart showing account actions"
        />
      </Card>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Data last updated: {new Date().toLocaleString()}
        </Text>
        <Text style={styles.footerNote}>
          Note: All data is anonymized and aggregated to protect user privacy.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF006E',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateRangeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  dateRangeButtonActive: {
    backgroundColor: '#FF006E',
  },
  dateRangeButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  dateRangeButtonTextActive: {
    color: '#fff',
  },
  customDateContainer: {
    marginTop: 10,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  datePickerLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#FF006E',
    marginTop: 10,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF006E',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  chartTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  chartTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginLeft: 8,
  },
  chartTypeButtonActive: {
    backgroundColor: '#FF006E',
  },
  chartTypeButtonText: {
    color: '#666',
    marginLeft: 5,
    fontSize: 12,
  },
  chartTypeButtonTextActive: {
    color: '#fff',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  footerNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default PrivacyAnalyticsDashboard;