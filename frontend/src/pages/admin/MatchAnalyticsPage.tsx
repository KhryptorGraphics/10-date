import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Spin, Tabs, DatePicker, Button, Select, Statistic, Alert } from 'antd';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import axios from 'axios';
import moment from 'moment';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

interface MatchQualityMetrics {
  averageCompatibilityScore: number;
  matchSuccessRate: number;
  averageResponseTime: number;
  averageMessagesPerMatch: number;
  totalMatchesAnalyzed: number;
}

interface CompatibilityDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface ParameterImpact {
  parameter: string;
  importance: number;
  correlationWithSuccess: number;
}

interface TimeSeriesData {
  date: string;
  successRate: number;
  matchCount: number;
}

interface BehavioralInsight {
  metric: string;
  value: number;
  change: number;
  insight: string;
}

const MatchAnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [qualityMetrics, setQualityMetrics] = useState<MatchQualityMetrics | null>(null);
  const [compatibilityDistribution, setCompatibilityDistribution] = useState<CompatibilityDistribution[]>([]);
  const [parameterImpact, setParameterImpact] = useState<ParameterImpact[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [behavioralInsights, setBehavioralInsights] = useState<BehavioralInsight[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateRange, interval]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const startDate = dateRange ? dateRange[0].format('YYYY-MM-DD') : undefined;
      const endDate = dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined;
      
      // Fetch quality metrics
      const qualityResponse = await axios.get('/api/admin/analytics/matches/quality', {
        params: { startDate, endDate }
      });
      setQualityMetrics(qualityResponse.data);
      
      // Fetch compatibility distribution
      const distributionResponse = await axios.get('/api/admin/analytics/matches/compatibility/distribution', {
        params: { startDate, endDate }
      });
      setCompatibilityDistribution(distributionResponse.data);
      
      // Fetch parameter impact analysis
      const parameterResponse = await axios.get('/api/admin/analytics/matches/parameters/impact', {
        params: { startDate, endDate }
      });
      setParameterImpact(parameterResponse.data);
      
      // Fetch success trend
      const trendResponse = await axios.get('/api/admin/analytics/matches/success/trend', {
        params: { startDate, endDate, interval }
      });
      setTimeSeriesData(trendResponse.data);
      
      // Fetch behavioral insights
      const insightsResponse = await axios.get('/api/admin/analytics/matches/behavioral/insights', {
        params: { startDate, endDate }
      });
      setBehavioralInsights(insightsResponse.data);
      
    } catch (err) {
      console.error('Error fetching match analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const handleIntervalChange = (value: 'day' | 'week' | 'month') => {
    setInterval(value);
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading && !qualityMetrics) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading match analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" type="primary" onClick={handleRefresh}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="match-analytics-page">
      <h1>Match Algorithm Analytics</h1>
      
      <div className="analytics-filters">
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={12}>
            <RangePicker 
              value={dateRange} 
              onChange={handleDateRangeChange} 
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8}>
            <Select 
              value={interval} 
              onChange={handleIntervalChange}
              style={{ width: 120 }}
            >
              <Option value="day">Daily</Option>
              <Option value="week">Weekly</Option>
              <Option value="month">Monthly</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button type="primary" onClick={handleRefresh}>
              Refresh
            </Button>
          </Col>
        </Row>
      </div>
      
      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          {qualityMetrics && (
            <Row gutter={16}>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Avg. Compatibility Score" 
                    value={qualityMetrics.averageCompatibilityScore} 
                    precision={1}
                    suffix="%" 
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Match Success Rate" 
                    value={qualityMetrics.matchSuccessRate} 
                    precision={1}
                    suffix="%" 
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Avg. Response Time" 
                    value={qualityMetrics.averageResponseTime} 
                    suffix="min" 
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Avg. Messages Per Match" 
                    value={qualityMetrics.averageMessagesPerMatch} 
                    precision={1}
                  />
                </Card>
              </Col>
            </Row>
          )}
          
          <Row gutter={16} style={{ marginTop: 20 }}>
            <Col span={12}>
              <Card title="Match Success Rate Trend">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="successRate" 
                      stroke="#8884d8" 
                      name="Success Rate (%)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Compatibility Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={compatibilityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="percentage"
                      nameKey="range"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {compatibilityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="Parameter Analysis" key="parameters">
          <Card title="Algorithm Parameter Impact">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={parameterImpact}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="parameter" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="importance" fill="#8884d8" name="Importance" />
                <Bar dataKey="correlationWithSuccess" fill="#82ca9d" name="Correlation with Success" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabPane>
        
        <TabPane tab="Behavioral Insights" key="behavioral">
          <Row gutter={16}>
            {behavioralInsights.map((insight, index) => (
              <Col span={8} key={index} style={{ marginBottom: 16 }}>
                <Card>
                  <Statistic
                    title={insight.metric}
                    value={insight.value}
                    precision={1}
                    valueStyle={{ 
                      color: insight.change > 0 ? '#3f8600' : insight.change < 0 ? '#cf1322' : 'inherit' 
                    }}
                  />
                  <div style={{ marginTop: 10 }}>
                    <small>{insight.insight}</small>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        
        <TabPane tab="Algorithm Tuning" key="tuning">
          <Alert
            message="Parameter Adjustment"
            description="This interface allows administrators to adjust the algorithm parameters to optimize matching performance."
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
          
          <Card title="Algorithm Parameter Adjustment">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Interface for algorithm parameter adjustment under development</p>
              <Button type="primary" disabled>Save Configuration</Button>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default MatchAnalyticsPage;
