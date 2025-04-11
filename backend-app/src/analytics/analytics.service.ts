import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { UserEntity } from '../user/user.entity/user.entity';
import { SwipeEntity } from '../matching/match.entity/swipe.entity';
import { MatchEntity } from '../matching/match.entity/match.entity';
import { Payment } from '../payments/payment.entity';
import { Message } from '../messaging/message.entity/message.entity';
import * as os from 'os';
import * as process from 'process';

interface PeriodParams {
  startDate: Date;
  endDate: Date;
}

interface TimeSeriesData {
  period: string;
  value: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private startTime = Date.now();

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(SwipeEntity)
    private swipeRepository: Repository<SwipeEntity>,
    @InjectRepository(MatchEntity)
    private matchRepository: Repository<MatchEntity>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>
  ) {}

  // User Engagement Metrics
  async getUserEngagement(period?: PeriodParams) {
    const dateFilter = this.getDateFilter(period);
    
    try {
      const [activeUsers, newUsers, totalUsers, inactiveUsers] = await Promise.all([
        this.getActiveUsers(period),
        this.getNewUsers(period),
        this.getTotalUsers(),
        this.getInactiveUsers(period)
      ]);

      const swipeCount = await this.swipeRepository.count({
        where: dateFilter ? { createdAt: Between(dateFilter.startDate, dateFilter.endDate) } : {}
      });

      const matchCount = await this.matchRepository.count({
        where: dateFilter ? { createdAt: Between(dateFilter.startDate, dateFilter.endDate) } : {}
      });

      const messageCount = await this.messageRepository.count({
        where: dateFilter ? { createdAt: Between(dateFilter.startDate, dateFilter.endDate) } : {}
      });

      // Calculate metrics
      const userGrowthRate = totalUsers.total > 0 ? (newUsers.count / totalUsers.total) * 100 : 0;
      const churnRate = totalUsers.total > 0 ? (inactiveUsers.count / totalUsers.total) * 100 : 0;
      const matchRate = swipeCount > 0 ? (matchCount / swipeCount) * 100 : 0;
      const avgSwipesPerUser = activeUsers.count > 0 ? swipeCount / activeUsers.count : 0;
      const avgMessagesPerMatch = matchCount > 0 ? messageCount / matchCount : 0;

      // Daily active users trend over time
      const dauTimeSeries = await this.getDailyActiveUsersTrend(period);

      return {
        activeUsers: activeUsers.count,
        dailyActiveUsers: activeUsers.dailyCount,
        weeklyActiveUsers: activeUsers.weeklyCount,
        monthlyActiveUsers: activeUsers.monthlyCount,
        newUsers: newUsers.count,
        totalUsers: totalUsers.total,
        churnRate: parseFloat(churnRate.toFixed(2)),
        engagement: {
          totalSwipes: swipeCount,
          totalMatches: matchCount,
          totalMessages: messageCount,
          matchRate: parseFloat(matchRate.toFixed(2)),
          averageSwipesPerUser: parseFloat(avgSwipesPerUser.toFixed(2)),
          averageMessagesPerMatch: parseFloat(avgMessagesPerMatch.toFixed(2)),
        },
        growth: {
          userGrowthRate: parseFloat(userGrowthRate.toFixed(2)),
          newUserTrend: newUsers.trend,
        },
        trends: {
          dailyActiveUsersTrend: dauTimeSeries,
        }
      };
    } catch (error) {
      this.logger.error(`Error getting user engagement metrics: ${error.message}`);
      throw error;
    }
  }

  // Revenue Analytics
  async getRevenueStats(period?: PeriodParams) {
    try {
      const dateFilter = this.getDateFilter(period);
      
      // Get all payments for the period
      const payments = await this.paymentRepository.find({
        where: dateFilter ? { createdAt: Between(dateFilter.startDate, dateFilter.endDate) } : {},
        relations: ['user'],
      });

      // Calculate metrics
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

      // Get unique premium users
      const premiumUserIds = new Set(payments.map(payment => payment.userId));
      const premiumUsers = premiumUserIds.size;

      // Get revenue by day/week/month
      const revenueByDay = this.aggregateRevenue(payments, 'day');
      const revenueByWeek = this.aggregateRevenue(payments, 'week');
      const revenueByMonth = this.aggregateRevenue(payments, 'month');
      
      // Average revenue per user
      const arpu = premiumUsers > 0 ? totalRevenue / premiumUsers : 0;
      
      // Get subscription trends
      const subscriptionTrend = await this.getSubscriptionTrend(period);

      return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        premiumUsers,
        averageRevenuePerUser: parseFloat(arpu.toFixed(2)),
        conversionRate: await this.getSubscriptionConversionRate(),
        revenue: {
          daily: revenueByDay,
          weekly: revenueByWeek,
          monthly: revenueByMonth,
        },
        trends: {
          subscriptions: subscriptionTrend,
        }
      };
    } catch (error) {
      this.logger.error(`Error getting revenue stats: ${error.message}`);
      throw error;
    }
  }

  // System Health Metrics
  async getSystemHealth() {
    try {
      const uptime = this.getSystemUptime();
      const memoryUsage = this.getMemoryUsage();
      const cpuUsage = this.getCpuUsage();
      
      // In a real implementation, these would be queried from a monitoring system
      // like Prometheus or logs processing system
      const errorRate = 0.5; // Placeholder - would be calculated from actual error logs
      const latency = 120; // Placeholder - would be measured from actual requests
      const requestsPerMinute = 350; // Placeholder - would be calculated from logs

      return {
        uptime,
        memory: memoryUsage,
        cpu: cpuUsage,
        performance: {
          errorRate,
          averageLatency: latency,
          requestsPerMinute
        }
      };
    } catch (error) {
      this.logger.error(`Error getting system health metrics: ${error.message}`);
      throw error;
    }
  }

  // Detailed Active Users Metrics
  async getActiveUsers(period?: PeriodParams): Promise<{
    count: number;
    dailyCount: number;
    weeklyCount: number;
    monthlyCount: number;
  }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dateFilter = this.getDateFilter(period);
    
    try {
      const [activeUsersPeriod, dailyActiveUsers, weeklyActiveUsers, monthlyActiveUsers] = await Promise.all([
        // Active users in the period
        this.usersRepository.createQueryBuilder('user')
          .where(dateFilter ? `user.lastActive BETWEEN :startDate AND :endDate` : '1=1')
          .setParameters(dateFilter || {})
          .getCount(),
          
        // DAU - Active in last 24 hours
        this.usersRepository.count({
          where: {
            lastActive: MoreThan(oneDayAgo)
          }
        }),
        
        // WAU - Active in last week
        this.usersRepository.count({
          where: {
            lastActive: MoreThan(oneWeekAgo)
          }
        }),
        
        // MAU - Active in last month
        this.usersRepository.count({
          where: {
            lastActive: MoreThan(oneMonthAgo)
          }
        })
      ]);

      return {
        count: activeUsersPeriod,
        dailyCount: dailyActiveUsers,
        weeklyCount: weeklyActiveUsers,
        monthlyCount: monthlyActiveUsers
      };
    } catch (error) {
      this.logger.error(`Error getting active users: ${error.message}`);
      return { count: 0, dailyCount: 0, weeklyCount: 0, monthlyCount: 0 };
    }
  }

  // New Users Metrics
  async getNewUsers(period?: PeriodParams): Promise<{ 
    count: number; 
    trend: TimeSeriesData[];
  }> {
    const dateFilter = this.getDateFilter(period);
    
    try {
      // Count new users in period
      const newUsersCount = await this.usersRepository.count({
        where: dateFilter ? {
          createdAt: Between(dateFilter.startDate, dateFilter.endDate)
        } : {}
      });

      // Get trend data - daily new users for past 30 days
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);
      
      const trend: TimeSeriesData[] = [];
      
      // Generate daily data points
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const count = await this.usersRepository.count({
          where: {
            createdAt: Between(currentDate, nextDay)
          }
        });
        
        trend.push({
          period: currentDate.toISOString().split('T')[0],
          value: count
        });
        
        currentDate = nextDay;
      }
      
      return {
        count: newUsersCount,
        trend
      };
    } catch (error) {
      this.logger.error(`Error getting new users: ${error.message}`);
      return { count: 0, trend: [] };
    }
  }

  // Helper Methods
  private async getTotalUsers() {
    try {
      const total = await this.usersRepository.count();
      return { total };
    } catch (error) {
      this.logger.error(`Error getting total users: ${error.message}`);
      return { total: 0 };
    }
  }
  
  private async getInactiveUsers(period?: PeriodParams) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const count = await this.usersRepository.count({
        where: {
          lastActive: LessThan(thirtyDaysAgo)
        }
      });
      
      return { count };
    } catch (error) {
      this.logger.error(`Error getting inactive users: ${error.message}`);
      return { count: 0 };
    }
  }
  
  private async getDailyActiveUsersTrend(period?: PeriodParams): Promise<TimeSeriesData[]> {
    const days = 14; // Show last 14 days
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    const trend: TimeSeriesData[] = [];
    try {
      // Generate daily data points
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const activeBetween = await this.usersRepository.count({
          where: {
            lastActive: Between(currentDate, nextDay)
          }
        });
        
        trend.push({
          period: currentDate.toISOString().split('T')[0],
          value: activeBetween
        });
        
        currentDate = nextDay;
      }
      
      return trend;
    } catch (error) {
      this.logger.error(`Error getting DAU trend: ${error.message}`);
      return [];
    }
  }
  
  private async getSubscriptionTrend(period?: PeriodParams): Promise<TimeSeriesData[]> {
    const days = 30; // Show last 30 days
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    const trend: TimeSeriesData[] = [];
    try {
      // Generate daily data points
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const paymentsOnDay = await this.paymentRepository.count({
          where: {
            createdAt: Between(currentDate, nextDay)
          }
        });
        
        trend.push({
          period: currentDate.toISOString().split('T')[0],
          value: paymentsOnDay
        });
        
        currentDate = nextDay;
      }
      
      return trend;
    } catch (error) {
      this.logger.error(`Error getting subscription trend: ${error.message}`);
      return [];
    }
  }
  
  private async getSubscriptionConversionRate(): Promise<number> {
    try {
      // Get total users
      const totalUsers = await this.usersRepository.count();
      
      // Get users who have made at least one payment
      const payingUsers = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('DISTINCT payment.userId')
        .getCount();
        
      // Calculate conversion rate
      return totalUsers > 0 ? parseFloat(((payingUsers / totalUsers) * 100).toFixed(2)) : 0;
    } catch (error) {
      this.logger.error(`Error calculating conversion rate: ${error.message}`);
      return 0;
    }
  }
  
  private getDateFilter(period?: PeriodParams): { startDate: Date; endDate: Date } | null {
    if (!period) return null;
    return {
      startDate: period.startDate,
      endDate: period.endDate
    };
  }
  
  private aggregateRevenue(payments: Payment[], groupBy: 'day' | 'week' | 'month'): TimeSeriesData[] {
    const grouped = new Map<string, number>();
    
    payments.forEach(payment => {
      let key = '';
      const date = new Date(payment.createdAt);
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          // Get the week number
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
          const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          key = `${date.getFullYear()}-W${weekNum}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
      }
      
      const currentAmount = grouped.get(key) || 0;
      grouped.set(key, currentAmount + payment.amount);
    });
    
    // Convert map to array of objects
    const result: TimeSeriesData[] = [];
    
    for (const [period, value] of grouped.entries()) {
      result.push({
        period,
        value: parseFloat(value.toFixed(2))
      });
    }
    
    // Sort by period
    result.sort((a, b) => a.period.localeCompare(b.period));
    
    return result;
  }
  
  private getSystemUptime(): string {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const uptimeHours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${uptimeDays} days, ${uptimeHours} hours`;
  }
  
  private getMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const totalSystemMemory = os.totalmem();
    const freeSystemMemory = os.freemem();
    
    return {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      systemMemoryTotal: Math.round(totalSystemMemory / 1024 / 1024), // MB
      systemMemoryFree: Math.round(freeSystemMemory / 1024 / 1024), // MB
      systemMemoryUsed: Math.round((totalSystemMemory - freeSystemMemory) / 1024 / 1024), // MB
      systemMemoryUsagePercent: Math.round(((totalSystemMemory - freeSystemMemory) / totalSystemMemory) * 100)
    };
  }
  
  private getCpuUsage() {
    const cpus = os.cpus();
    const numCpus = cpus.length;
    
    // Calculate average CPU usage across all cores
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idlePercent = totalIdle / totalTick;
    const usagePercent = 100 - (idlePercent * 100);
    
    return {
      cores: numCpus,
      usagePercent: Math.round(usagePercent),
      model: cpus[0].model
    };
  }
}
