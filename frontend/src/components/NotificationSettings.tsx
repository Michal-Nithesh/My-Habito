import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NotificationPreferences } from '@/types';
import { notificationService } from '@/services/notifications';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Bell, BellOff, Clock, Smartphone, Mail, Zap } from 'lucide-react';

export function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [permissionState, setPermissionState] = useState(notificationService.getPermissionState());

  useEffect(() => {
    fetchPreferences();
    notificationService.initialize();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get<NotificationPreferences>('/reminders/preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await api.patch<NotificationPreferences>('/reminders/preferences', updates);
      setPreferences(response.data);
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      const permission = await notificationService.requestPermission();
      setPermissionState(notificationService.getPermissionState());

      if (permission === 'granted') {
        const subscription = await notificationService.subscribeToPush();
        if (subscription) {
          await api.post('/reminders/push/subscribe', subscription);
          await updatePreferences({ push_enabled: true });
          toast.success('Push notifications enabled!');
        }
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      toast.error('Failed to enable notifications');
    }
  };

  const handleDisablePushNotifications = async () => {
    try {
      const unsubscribed = await notificationService.unsubscribeFromPush();
      if (unsubscribed) {
        await updatePreferences({ push_enabled: false });
        toast.success('Push notifications disabled');
      }
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
      toast.error('Failed to disable notifications');
    }
  };

  if (loading || !preferences) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {preferences.notifications_enabled ? (
              <Bell className="w-5 h-5 text-green-500" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how you want to be reminded about your habits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive reminders and updates about your habits
              </p>
            </div>
            <Button
              variant={preferences.notifications_enabled ? 'default' : 'outline'}
              onClick={() =>
                updatePreferences({
                  notifications_enabled: !preferences.notifications_enabled,
                })
              }
              disabled={saving}
            >
              {preferences.notifications_enabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      {notificationService.isSupported() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-500" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Get real-time notifications even when the app is closed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!permissionState.granted && !permissionState.denied && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Enable push notifications to receive reminders even when you're not using the app.
                </p>
              </div>
            )}

            {permissionState.denied && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-red-900 dark:text-red-100">
                  Push notifications are blocked. Please enable them in your browser settings.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Browser Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  {permissionState.granted
                    ? 'You will receive push notifications'
                    : 'Not enabled'}
                </p>
              </div>
              {!preferences.push_enabled ? (
                <Button
                  onClick={handleEnablePushNotifications}
                  disabled={saving || permissionState.denied}
                >
                  Enable
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleDisablePushNotifications}
                  disabled={saving}
                >
                  Disable
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            Daily Summary
          </CardTitle>
          <CardDescription>
            Get a daily overview of your habit progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Daily Summary</Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary of your habits each day
              </p>
            </div>
            <Button
              variant={preferences.daily_summary_enabled ? 'default' : 'outline'}
              onClick={() =>
                updatePreferences({
                  daily_summary_enabled: !preferences.daily_summary_enabled,
                })
              }
              disabled={saving}
            >
              {preferences.daily_summary_enabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {preferences.daily_summary_enabled && (
            <div className="space-y-2">
              <Label htmlFor="summary-time">Summary Time</Label>
              <Input
                id="summary-time"
                type="time"
                value={preferences.daily_summary_time}
                onChange={(e) =>
                  updatePreferences({ daily_summary_time: e.target.value })
                }
                disabled={saving}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Smart Reminders
          </CardTitle>
          <CardDescription>
            Intelligent reminders based on your completion status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Smart Evening Reminder</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded in the evening if you haven't completed your habits
              </p>
            </div>
            <Button
              variant={preferences.smart_reminders_enabled ? 'default' : 'outline'}
              onClick={() =>
                updatePreferences({
                  smart_reminders_enabled: !preferences.smart_reminders_enabled,
                })
              }
              disabled={saving}
            >
              {preferences.smart_reminders_enabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {preferences.smart_reminders_enabled && (
            <div className="space-y-2">
              <Label htmlFor="smart-time">Evening Check Time</Label>
              <Input
                id="smart-time"
                type="time"
                value={preferences.smart_reminder_time}
                onChange={(e) =>
                  updatePreferences({ smart_reminder_time: e.target.value })
                }
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                We'll check if you've completed your habits and send a reminder if needed
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive habit updates via email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Email Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get habit reminders sent to your email
              </p>
            </div>
            <Button
              variant={preferences.email_enabled ? 'default' : 'outline'}
              onClick={() =>
                updatePreferences({
                  email_enabled: !preferences.email_enabled,
                })
              }
              disabled={saving}
            >
              {preferences.email_enabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
