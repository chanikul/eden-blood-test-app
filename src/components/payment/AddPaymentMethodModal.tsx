import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../ui";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Loader2, Plus } from "lucide-react";
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface AddressFields {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

interface AddPaymentMethodModalProps {
  onSuccess: () => void;
  shippingAddress?: AddressFields;
}

export function AddPaymentMethodModal({ onSuccess, shippingAddress }: AddPaymentMethodModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  const [billingAddressType, setBillingAddressType] = useState<'shipping' | 'separate'>('shipping');
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [billingAddress, setBillingAddress] = useState<Omit<AddressFields, 'state'>>({
    line1: '',
    city: '',

    postalCode: '',
    country: '',
  });

  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error('Stripe not initialized');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Card element not found');
      return;
    }

    setLoading(true);

    try {
      const billingDetails = {
        name: cardholderName,
        address: billingAddressType === 'shipping' ? shippingAddress : {
          line1: billingAddress.line1,
          city: billingAddress.city,
          postal_code: billingAddress.postalCode,
          country: billingAddress.country || 'GB'
        }
      };

      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: billingDetails,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (paymentMethod) {
        // Include billing address in payload if 'separate' is selected
        const payload: any = { paymentMethodId: paymentMethod.id };
        if (billingAddressType === 'separate') {
          payload.billingAddress = billingAddress;
        }
        const response = await fetch('/api/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include'
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add payment method');
        }

        toast.success('Payment method added successfully');
        onSuccess();
        setOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add payment method');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#203749] hover:bg-[#203749]/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[500px]"
        aria-describedby="payment-method-description"
      >
        <div id="payment-method-description" className="sr-only">
          Add a new credit or debit card to your account for future payments
        </div>
        <DialogHeader>
          <DialogTitle className="text-[#203749]">Add Payment Method</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-element">Card Information</Label>
              <div className="mt-1 p-3 border rounded-md border-[#D4D3D2]">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
                      },
                    },
                    hidePostalCode: true
                  }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cardholderName">Name on card</Label>
              <Input
                id="cardholderName"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="John Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Billing Address</Label>
              <RadioGroup
                value={billingAddressType}
                onValueChange={(value: 'shipping' | 'separate') => {
                  setBillingAddressType(value);
                  if (value === 'separate') {
                    setIsAddressOpen(true);
                  }
                }}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shipping" id="shipping" />
                  <Label htmlFor="shipping">Same as shipping address</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="separate" id="separate" />
                  <Label htmlFor="separate">Use a different billing address</Label>
                </div>
              </RadioGroup>
            </div>

            <Collapsible
              open={billingAddressType === 'separate' && isAddressOpen}
              onOpenChange={setIsAddressOpen}
              className={cn(
                'space-y-2 rounded-md',
                billingAddressType === 'separate' ? 'block' : 'hidden'
              )}
            >
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex w-full justify-between p-4 font-normal"
                >
                  <span>Billing Address Details</span>
                  {isAddressOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 px-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="line1">Address Line 1</Label>
                    <Input
                      id="line1"
                      value={billingAddress.line1}
                      onChange={(e) => setBillingAddress({ ...billingAddress, line1: e.target.value })}
                      className="border-[#D4D3D2]"
                      required
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={billingAddress.city}
                      onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                      className="border-[#D4D3D2]"
                      required
                      placeholder="London"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postcode</Label>
                    <Input
                      id="postalCode"
                      value={billingAddress.postalCode}
                      onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
                      className="border-[#D4D3D2]"
                      required
                      placeholder="SW1A 1AA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={billingAddress.country || 'GB'}
                      onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                      className="border-[#D4D3D2]"
                      required
                      defaultValue="GB"
                      readOnly
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#203749] hover:bg-[#203749]/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding payment method...
              </>
            ) : (
              'Add payment method'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
