"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (result?.error) {
          setError("邮箱或密码错误");
        } else {
          router.push("/dashboard");
        }
      } else {
        // 注册
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (data.success) {
          // 注册成功后自动登录
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (result?.ok) {
            router.push("/dashboard");
          }
        } else {
          setError(data.error || "注册失败");
        }
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">财富自由之路</h1>
          <p className="text-slate-400">
            {isLogin ? "登录你的账户" : "创建新账户"}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          {/* Tab 切换 */}
          <div className="flex mb-6 bg-slate-900 rounded-lg p-1">
            <button
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                isLogin
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              登录
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                !isLogin
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  昵称
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="你的昵称"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-300 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="至少6位"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
            >
              {loading ? "处理中..." : isLogin ? "登录" : "注册"}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-4">
            {isLogin ? "没有账户？" : "已有账户？"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-blue-400 hover:text-blue-300 ml-1"
            >
              {isLogin ? "去注册" : "去登录"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
