import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function OrganizerSettings() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold font-display">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>

      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle className="font-display text-lg">Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            {/* <Input
              value="john@example.com"
              readOnly
              className="bg-muted/20 border-border/40"
            /> */}
            <Input
              value={localStorage.getItem("grabpic_email") ?? ""}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              placeholder="John Doe"
              className="bg-muted/20 border-border/40"
            />
          </div>
          {/* <Button className="gradient-primary border-0">Save Changes</Button> */}
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle className="font-display text-lg">Notifications</CardTitle>
          <CardDescription>Configure how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">
                Receive upload & search summaries
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="opacity-30" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Processing alerts</p>
              <p className="text-xs text-muted-foreground">
                Get notified when photos finish processing
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-destructive/20">
        <CardHeader>
          <CardTitle className="font-display text-lg text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          {/* <Button variant="destructive" size="sm">
            Delete Account
          </Button> */}
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
