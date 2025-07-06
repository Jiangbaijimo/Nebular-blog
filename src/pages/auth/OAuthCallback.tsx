import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores';
import { oauthService } from '../../services/auth/oauthService';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const response = await oauthService.handleWebAppCallback(new URL(window.location.href));
        // 使用useAuth中的login方法来更新全局状态
        login(response.user, response.tokens);
        // 登录成功后重定向到首页
        navigate('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        // 可以在这里向用户显示错误信息
        navigate('/login', { state: { error: 'OAuth authentication failed.' } });
      }
    };

    handleCallback();
  }, [navigate, login]);

  return <div>Loading...</div>;
};

export default OAuthCallback;