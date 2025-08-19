import { useState, useEffect } from "react";
import { CreditCard, Users, DollarSign, TrendingUp, Crown, Star, Check, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAuth } from "../AuthContext";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: {
    maxTrackedProducts: number;
    alertFrequency: string;
    priceHistoryDays: number;
    exportData: boolean;
    prioritySupport: boolean;
  };
}

interface SubscriptionStats {
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
}

interface Transaction {
  id: string;
  user: string;
  plan: string;
  amount: number;
  date: string;
  status: 'completed' | 'failed' | 'pending';
}

export function SubscriptionPage() {
  const { token } = useAuth();
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats>({
    totalRevenue: 0,
    activeSubscriptions: 0,
    churnRate: 0,
    averageRevenuePerUser: 0
  });
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);
  const [showEditPlanDialog, setShowEditPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: 0,
    interval: 'monthly' as 'monthly' | 'yearly',
    maxTrackedProducts: 50,
    alertFrequency: 'daily' as 'instant' | 'hourly' | 'daily',
    priceHistoryDays: 60,
    exportData: false,
    prioritySupport: false,
  });
  const [createYearly, setCreateYearly] = useState(false);
  const [newPlanYearlyPrice, setNewPlanYearlyPrice] = useState<number | ''>('');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription plans
      const plansResponse = await fetch('/api/payments/plans');
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        if (plansData.success) {
          setPlans(plansData.data.plans);
        }
      }

      // For now, we'll use mock data for stats since backend doesn't have subscription stats yet
      // TODO: Replace with real API calls when backend implements subscription statistics
      setSubscriptionStats({
        totalRevenue: 0, // Will be calculated from actual transactions
        activeSubscriptions: 0, // Will be calculated from active subscriptions
        churnRate: 0, // Will be calculated from subscription cancellations
        averageRevenuePerUser: 0 // Will be calculated from total revenue / active users
      });

      // Recent transactions - empty for now as requested
      setRecentTransactions([]);
      
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const handleCreatePlan = async () => {
    try {
      // Always create monthly or yearly based on interval
      const payloadBase = {
        name: newPlan.name,
        currency: 'USD',
        features: {
          maxTrackedProducts: newPlan.maxTrackedProducts,
          alertFrequency: newPlan.alertFrequency,
          priceHistoryDays: newPlan.priceHistoryDays,
          exportData: newPlan.exportData,
          prioritySupport: newPlan.prioritySupport
        }
      };

      const createdIds: string[] = [];

      // Create primary plan (respect selected interval)
      {
        const res = await fetch('/api/payments/plans', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ ...payloadBase, interval: newPlan.interval, price: newPlan.price })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to create plan');
        }
        const j = await res.json();
        if (j?.data?.plan?.id) createdIds.push(j.data.plan.id);
      }

      // Optionally create yearly counterpart
      if (createYearly && typeof newPlanYearlyPrice === 'number' && newPlanYearlyPrice > 0) {
        const res2 = await fetch('/api/payments/plans', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ ...payloadBase, interval: 'yearly', price: newPlanYearlyPrice })
        });
        if (!res2.ok) {
          const err = await res2.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to create yearly plan');
        }
      }

      await fetchSubscriptionData();
      setShowCreatePlanDialog(false);
      resetNewPlan();
      setCreateYearly(false);
      setNewPlanYearlyPrice('');
      alert('Plan created successfully');
    } catch (error) {
      console.error('Error creating plan:', error);
      alert(error instanceof Error ? error.message : 'Error creating plan');
    }
  };

  const handleEditPlan = async () => {
    if (!editingPlan) return;
    
    try {
      const payload = {
        name: editingPlan.name,
        price: editingPlan.price,
        interval: editingPlan.interval,
        features: editingPlan.features
      };

      const res = await fetch(`/api/payments/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update plan');
      }

      await fetchSubscriptionData();
      setShowEditPlanDialog(false);
      setEditingPlan(null);
      alert('Plan updated successfully');
    } catch (error) {
      console.error('Error updating plan:', error);
      alert(error instanceof Error ? error.message : 'Error updating plan');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const res = await fetch(`/api/payments/plans/${planId}`, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete plan');
      }

      await fetchSubscriptionData();
      alert('Plan deleted successfully');
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert(error instanceof Error ? error.message : 'Error deleting plan');
    }
  };

  const resetNewPlan = () => {
    setNewPlan({
      name: '',
      price: 0,
      interval: 'monthly',
      maxTrackedProducts: 50,
      alertFrequency: 'daily',
      priceHistoryDays: 60,
      exportData: false,
      prioritySupport: false
    });
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan });
    setShowEditPlanDialog(true);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Subscription Management</h2>
          <p className="text-muted-foreground">Monitor revenue, plans, and billing</p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-black text-white hover:bg-gray-800"
          onClick={() => setShowCreatePlanDialog(true)}
        >
          <Plus size={16} />
          Create Plan
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0" style={{ backgroundColor: '#EEFDF2' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#008236' }}>Monthly Revenue</p>
                <p className="text-2xl font-bold" style={{ color: '#008236' }}>
                  ${subscriptionStats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs" style={{ color: '#008236' }}>+12% from last month</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" style={{ color: '#008236' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0" style={{ backgroundColor: '#EDF5FF' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#1447E6' }}>Active Subscriptions</p>
                <p className="text-2xl font-bold" style={{ color: '#1447E6' }}>
                  {subscriptionStats.activeSubscriptions.toLocaleString()}
                </p>
                <p className="text-xs" style={{ color: '#1447E6' }}>+8% from last month</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(20,71,230,0.1)' }}>
                <Users className="w-6 h-6" style={{ color: '#1447E6' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0" style={{ backgroundColor: '#F9F4FF' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#8200DB' }}>ARPU</p>
                <p className="text-2xl font-bold" style={{ color: '#8200DB' }}>
                  ${subscriptionStats.averageRevenuePerUser}
                </p>
                <p className="text-xs" style={{ color: '#8200DB' }}>+5% from last month</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6" style={{ color: '#8200DB' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0" style={{ backgroundColor: '#FAF4FF' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#C40D13' }}>Churn Rate</p>
                <p className="text-2xl font-bold" style={{ color: '#C40D13' }}>
                  {subscriptionStats.churnRate}%
                </p>
                <p className="text-xs" style={{ color: '#C40D13' }}>-0.5% from last month</p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" style={{ color: '#C40D13' }} rotate={180} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 ${
              plan.name.toLowerCase().includes('basic') ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
              plan.name.toLowerCase().includes('premium') ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
              'bg-gradient-to-r from-amber-500 to-amber-600'
            }`} />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${
                    plan.name.toLowerCase().includes('basic') ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    plan.name.toLowerCase().includes('premium') ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                    'bg-gradient-to-r from-amber-500 to-amber-600'
                  } rounded-lg flex items-center justify-center`}>
                    {plan.name.toLowerCase().includes('basic') && <Star className="w-4 h-4 text-white" />}
                    {plan.name.toLowerCase().includes('premium') && <Crown className="w-4 h-4 text-white" />}
                    {!plan.name.toLowerCase().includes('basic') && !plan.name.toLowerCase().includes('premium') && <CreditCard className="w-4 h-4 text-white" />}
                  </div>
                  {plan.name}
                </CardTitle>
                <Badge variant="secondary">{plan.interval}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Features:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={12} className="text-green-500 flex-shrink-0" />
                    {plan.features.maxTrackedProducts} tracked products
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={12} className="text-green-500 flex-shrink-0" />
                    {plan.features.alertFrequency} alerts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={12} className="text-green-500 flex-shrink-0" />
                    {plan.features.priceHistoryDays}-day price history
                  </li>
                  {plan.features.exportData && (
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check size={12} className="text-green-500 flex-shrink-0" />
                      Data export
                    </li>
                  )}
                  {plan.features.prioritySupport && (
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check size={12} className="text-green-500 flex-shrink-0" />
                      Priority support
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => openEditDialog(plan)}
                >
                  <Edit size={14} className="mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 text-red-600 hover:text-red-700"
                  onClick={() => handleDeletePlan(plan.id)}
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Transactions will appear here once you start monetizing</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.plan}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">${transaction.amount}</TableCell>
                      <TableCell className="text-muted-foreground">{transaction.date}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'destructive'}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Plan Dialog */}
      <Dialog open={showCreatePlanDialog} onOpenChange={setShowCreatePlanDialog}>
        <DialogContent className="max-w-md bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create New Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="planName" className="text-gray-700">Plan Name</Label>
              <Input
                id="planName"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                placeholder="e.g., Basic, Premium"
                className="bg-white border-[#E5E5E5] placeholder:text-[#717182]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planPrice" className="text-gray-700">Monthly Price</Label>
                <Input
                  id="planPrice"
                  type="number"
                  step="0.01"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="bg-white border-[#E5E5E5] placeholder:text-[#717182]"
                />
              </div>
              <div className="flex items-end gap-2">
                <input
                  id="createYearly"
                  type="checkbox"
                  className="rounded mt-6"
                  checked={createYearly}
                  onChange={(e) => setCreateYearly(e.target.checked)}
                />
                <Label htmlFor="createYearly">Add annual plan</Label>
              </div>
            </div>
            {createYearly && (
              <div>
                <Label htmlFor="annualPrice" className="text-gray-700">Annual Price</Label>
                <Input
                  id="annualPrice"
                  type="number"
                  step="0.01"
                  value={newPlanYearlyPrice}
                  onChange={(e) => setNewPlanYearlyPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="bg-white border-[#E5E5E5] placeholder:text-[#717182]"
                />
              </div>
            )}
            <div>
              <Label htmlFor="planInterval">Billing Interval</Label>
              <Select value={newPlan.interval} onValueChange={(value: 'monthly' | 'yearly') => setNewPlan({ ...newPlan, interval: value })}>
                <SelectTrigger className="bg-white border-[#E5E5E5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-0 shadow-lg rounded-lg">
                  <SelectItem value="monthly" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Monthly</SelectItem>
                  <SelectItem value="yearly" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxProducts">Max Tracked Products</Label>
              <Input
                id="maxProducts"
                type="number"
                value={newPlan.maxTrackedProducts}
                onChange={(e) => setNewPlan({ ...newPlan, maxTrackedProducts: parseInt(e.target.value) })}
                placeholder="50"
                className="bg-white border-[#E5E5E5] placeholder:text-[#717182]"
              />
            </div>
            <div>
              <Label htmlFor="alertFrequency">Alert Frequency</Label>
              <Select value={newPlan.alertFrequency} onValueChange={(value: 'instant' | 'hourly' | 'daily') => setNewPlan({ ...newPlan, alertFrequency: value })}>
                <SelectTrigger className="bg-white border-[#E5E5E5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-0 shadow-lg rounded-lg">
                  <SelectItem value="instant" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Instant</SelectItem>
                  <SelectItem value="hourly" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Hourly</SelectItem>
                  <SelectItem value="daily" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priceHistory">Price History Days</Label>
              <Input
                id="priceHistory"
                type="number"
                value={newPlan.priceHistoryDays}
                onChange={(e) => setNewPlan({ ...newPlan, priceHistoryDays: parseInt(e.target.value) })}
                placeholder="60"
                className="bg-white border-[#E5E5E5] placeholder:text-[#717182]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="exportData"
                checked={newPlan.exportData}
                onChange={(e) => setNewPlan({ ...newPlan, exportData: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="exportData">Data Export</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="prioritySupport"
                checked={newPlan.prioritySupport}
                onChange={(e) => setNewPlan({ ...newPlan, prioritySupport: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="prioritySupport">Priority Support</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreatePlanDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePlan}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Create Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={showEditPlanDialog} onOpenChange={setShowEditPlanDialog}>
        <DialogContent className="max-w-md bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Plan</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editPlanName">Plan Name</Label>
                <Input
                  id="editPlanName"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="e.g., Basic, Premium"
                  className="bg-white border-[#E5E5E5] placeholder:text-[#717182]"
                />
              </div>
              <div>
                <Label htmlFor="editPlanPrice">Price</Label>
                <Input
                  id="editPlanPrice"
                  type="number"
                  step="0.01"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="bg-white border-[#E5E5E5] placeholder:text-[#717182]"
                />
              </div>
              <div>
                <Label htmlFor="editPlanInterval">Billing Interval</Label>
                <Select value={editingPlan.interval} onValueChange={(value: 'monthly' | 'yearly') => setEditingPlan({ ...editingPlan, interval: value })}>
                  <SelectTrigger className="bg-white border-[#E5E5E5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-0 shadow-lg rounded-lg">
                    <SelectItem value="monthly" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Monthly</SelectItem>
                    <SelectItem value="yearly" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editMaxProducts">Max Tracked Products</Label>
                <Input
                  id="editMaxProducts"
                  type="number"
                  value={editingPlan.features.maxTrackedProducts}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    features: { ...editingPlan.features, maxTrackedProducts: parseInt(e.target.value) }
                  })}
                  placeholder="50"
                  className="bg-white border-[#E5E5E5] placeholder:text-[#717182]"
                />
              </div>
              <div>
                <Label htmlFor="editAlertFrequency">Alert Frequency</Label>
                <Select value={editingPlan.features.alertFrequency} onValueChange={(value: 'instant' | 'hourly' | 'daily') => setEditingPlan({
                  ...editingPlan,
                  features: { ...editingPlan.features, alertFrequency: value }
                })}>
                  <SelectTrigger className="bg-white border-[#E5E5E5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-0 shadow-lg rounded-lg">
                    <SelectItem value="instant" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Instant</SelectItem>
                    <SelectItem value="hourly" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Hourly</SelectItem>
                    <SelectItem value="daily" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editPriceHistory">Price History Days</Label>
                <Input
                  id="editPriceHistory"
                  type="number"
                  value={editingPlan.features.priceHistoryDays}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    features: { ...editingPlan.features, priceHistoryDays: parseInt(e.target.value) }
                  })}
                  placeholder="60"
                  className="bg-white border-[#E5E5E5] placeholder:text-[#717182]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editExportData"
                  checked={editingPlan.features.exportData}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    features: { ...editingPlan.features, exportData: e.target.checked }
                  })}
                  className="rounded"
                />
                <Label htmlFor="editExportData">Data Export</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editPrioritySupport"
                  checked={editingPlan.features.prioritySupport}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    features: { ...editingPlan.features, prioritySupport: e.target.checked }
                  })}
                  className="rounded"
                />
                <Label htmlFor="editPrioritySupport">Priority Support</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditPlanDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditPlan}
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                >
                  Update Plan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}