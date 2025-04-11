import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('create')
  async createPayment(@Body() paymentData: any) {
    return this.paymentsService.createPayment(paymentData);
  }

  @Get(':userId')
  async getUserPayments(@Param('userId') userId: string) {
    return this.paymentsService.getUserPayments(userId);
  }

  @Post('intent')
  async createPaymentIntent(@Body() body: { amount: number; currency?: string }) {
    return this.stripeService.createPaymentIntent(body.amount, body.currency);
  }

  @Get('payment/:id')
  async getPayment(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }

  @Post('refund/:id')
  async refundPayment(@Param('id') id: string) {
    // TODO: Integrate with Stripe refund API
    return { refunded: true, paymentId: id };
  }
}
