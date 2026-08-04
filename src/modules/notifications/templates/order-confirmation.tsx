import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Heading,
  Section,
  Row,
  Column,
  Img,
  Hr,
  Link,
  Preview
} from '@react-email/components';

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  total: number;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  shippingAddress: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

export const OrderConfirmationEmail = ({
  customerName,
  orderNumber,
  orderDate,
  total,
  items,
  shippingAddress
}: OrderConfirmationEmailProps) => {
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(total);

  return (
    <Html>
      <Head />
      <Preview>Your Vamika Order Confirmation #{orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>VAMIKA</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={title}>Order Confirmed</Heading>
            <Text style={text}>
              Hi {customerName},
            </Text>
            <Text style={text}>
              Thank you for shopping with Vamika. We've received your order and are getting it ready for shipment.
            </Text>
            
            <Section style={orderDetailsInfo}>
              <Text style={detailText}><strong>Order Number:</strong> {orderNumber}</Text>
              <Text style={detailText}><strong>Date:</strong> {orderDate}</Text>
            </Section>

            <Hr style={divider} />
            
            <Heading as="h3" style={subtitle}>Order Summary</Heading>
            
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemImageCol}>
                  <Img src={item.image} width="64" height="64" alt={item.title} style={itemImage} />
                </Column>
                <Column style={itemDetailsCol}>
                  <Text style={itemTitle}>{item.title}</Text>
                  <Text style={itemSubtext}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={itemPriceCol}>
                  <Text style={itemPriceText}>
                    ${item.price}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={divider} />
            
            <Row>
              <Column>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column style={totalValueCol}>
                <Text style={totalValueText}>{formattedTotal}</Text>
              </Column>
            </Row>

            <Hr style={divider} />
            
            <Heading as="h3" style={subtitle}>Shipping Address</Heading>
            <Text style={text}>
              {shippingAddress.line1}<br/>
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
            </Text>

            <Section style={buttonContainer}>
              <Link href={`https://vamika.example.com/account/orders/${orderNumber}`} style={button}>
                View Order Status
              </Link>
            </Section>
            
            <Text style={footerText}>
              If you have any questions, please reply to this email or contact our support team.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '32px',
  textAlign: 'center' as const,
  backgroundColor: '#232f3e', // Vamika charcoal-ish
};

const headerTitle = {
  color: '#D4AF37', // Vamika gold
  fontSize: '24px',
  margin: '0',
  letterSpacing: '4px',
};

const content = {
  padding: '0 48px',
};

const title = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525f7f',
};

const detailText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#525f7f',
  margin: '4px 0',
};

const orderDetailsInfo = {
  backgroundColor: '#f4f4f5',
  padding: '16px',
  borderRadius: '4px',
  marginTop: '24px',
};

const subtitle = {
  fontSize: '18px',
  lineHeight: '1.4',
  fontWeight: '600',
  color: '#484848',
  marginTop: '32px',
};

const itemRow = {
  marginBottom: '16px',
};

const itemImageCol = {
  width: '64px',
};

const itemImage = {
  borderRadius: '4px',
};

const itemDetailsCol = {
  paddingLeft: '16px',
};

const itemTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#484848',
  margin: '0 0 4px',
};

const itemSubtext = {
  fontSize: '14px',
  color: '#525f7f',
  margin: '0',
};

const itemPriceCol = {
  textAlign: 'right' as const,
};

const itemPriceText = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#484848',
  margin: '0',
};

const divider = {
  borderTop: '1px solid #e6ebf1',
  margin: '24px 0',
};

const totalLabel = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#484848',
  margin: '0',
};

const totalValueCol = {
  textAlign: 'right' as const,
};

const totalValueText = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#D4AF37', // Gold
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#D4AF37',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#8898aa',
  textAlign: 'center' as const,
};
