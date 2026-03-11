'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('登录成功');
        router.push('/');
        router.refresh();
      } else {
        toast.error(data.message || '登录失败');
      }
    } catch {
      toast.error('网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 min-w-0 overflow-x-hidden">
      <Card className="w-full max-w-md max-w-[min(28rem,100%)] rounded-2xl border-none shadow-2xl shrink-0">
        <CardHeader className="space-y-3 text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">金图考勤管理系统</CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            Admin Login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium">账号</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg"
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-lg font-bold text-xs" disabled={loading}>
              {loading ? '正在登录...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
