import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../config/api';
import { getHeaders } from '../../config/fetch';
import { useAuth } from '../context/AuthContext';

// Завершать браузер после успешной авторизации
WebBrowser.maybeCompleteAuthSession();

// Типы для TypeScript
interface LoginFormData {
  email: string;
  password: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
}

// Константы цветовой палитры (сине-белая)
const COLORS = {
  primary: '#2563EB',
  secondary: '#3B82F6',
  accent: '#60A5FA',
  background: '#F8FAFC',
  white: '#FFFFFF',
  gray: '#94A3B8',
  darkGray: '#64748B',
  error: '#EF4444',
  success: '#10B981',
  googleRed: '#DB4437',
} as const;

// Получение размеров экрана для адаптивности
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375;
const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;

// Утилита для валидации email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Компонент формы логина
const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { signIn } = useAuth();

  // Состояния формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState({ email: false, password: false });

  // Анимации
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Запуск анимации появления при монтировании
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Анимация тряски при ошибке
  const shakeAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Валидация формы в реальном времени
  const validateForm = useCallback((field: 'email' | 'password', value: string): string | undefined => {
    if (field === 'email') {
      if (!value.trim()) {
        return 'Email обязателен';
      }
      if (!validateEmail(value)) {
        return 'Введите корректный email';
      }
    }
    
    if (field === 'password') {
      if (!value) {
        return 'Пароль обязателен';
      }
      if (value.length < 6) {
        return 'Минимум 6 символов';
      }
    }
    
    return undefined;
  }, []);

  // Обработчик изменения email с валидацией
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (touched.email) {
      const error = validateForm('email', text);
      setErrors(prev => ({ ...prev, email: error }));
    }
  }, [touched.email, validateForm]);

  // Обработчик изменения пароля с валидацией
  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (touched.password) {
      const error = validateForm('password', text);
      setErrors(prev => ({ ...prev, password: error }));
    }
  }, [touched.password, validateForm]);

  // Обработчик потери фокуса для отметки поля как "тронутого"
  const handleBlur = useCallback((field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field === 'email' ? email : password;
    const error = validateForm(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [email, password, validateForm]);

  // Обработчик переключения видимости пароля с haptic feedback
  const handleTogglePassword = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowPassword(prev => !prev);
  }, []);

  // Обработчик "Запомнить меня" с haptic feedback
  const handleToggleRememberMe = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRememberMe(prev => !prev);
  }, []);

  // Обработчик входа
  const handleLogin = useCallback(async () => {
    // Отметить все поля как "тронутые"
    setTouched({ email: true, password: true });

    // Валидация
    const emailError = validateForm('email', email);
    const passwordError = validateForm('password', password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      shakeAnimation();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setLoading(true);
    console.log('🔑 Попытка входа с:', email);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('📦 Ответ сервера:', data);

      if (data.success) {
        console.log('✅ Вход успешен, пользователь:', data.data.user);
        
        // Haptic feedback на успех
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Используем signIn из AuthContext
        await signIn(data.data.token, data.data.user);
        console.log('✅ SignIn завершен');

        // Перенаправить в зависимости от роли
        if (data.data.user.role === 'admin') {
          console.log('🔄 Перенаправление на панель администратора');
          router.replace('/(admin)/dashboard');
        } else {
          console.log('🔄 Перенаправление на домашнюю страницу');
          router.replace('/(user)/home');
        }
      } else {
        console.error('❌ Вход не удался:', data.error);
        shakeAnimation();
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert('Ошибка', data.error || 'Неверный email или пароль');
      }
    } catch (error) {
      console.error('❌ Ошибка входа:', error);
      shakeAnimation();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Ошибка', 'Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  }, [email, password, validateForm, shakeAnimation, signIn, router]);

  // Обработчик входа через Google
  const handleGoogleLogin = useCallback(async () => {
    try {
      setLoading(true);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Определяем redirect URI для текущей платформы
      const redirectUri = Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : AuthSession.makeRedirectUri({
            scheme: 'mycloud',
            path: 'auth/callback'
          });
      
      console.log('🔑 Начало Google OAuth с redirect:', redirectUri);
      
      // Формируем URL для авторизации Google
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
        `client_id=${encodeURIComponent('735617581412-e8ceb269bj7qqrv9sl066q63g5dr5sne.apps.googleusercontent.com')}&` +
        `redirect_uri=${encodeURIComponent(`${API_URL}/api/auth/google/callback`)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('openid profile email')}&` +
        `access_type=offline&` +
        `prompt=select_account&` +
        `state=${encodeURIComponent(redirectUri)}`;
      
      console.log('🌐 Открытие Google auth URL');
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Для веб - перенаправляем в той же вкладке
        window.location.href = authUrl;
      } else {
        // Для мобильных - используем WebBrowser
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectUri
        );
        
        console.log('📦 Результат авторизации:', result);
        
        if (result.type === 'success') {
          const url = result.url;
          console.log('✅ URL успеха:', url);
          
          if (url.includes('token=')) {
            const tokenMatch = url.match(/token=([^&]+)/);
            const userMatch = url.match(/user=([^&#]+)/);
            
            if (tokenMatch && userMatch) {
              const token = tokenMatch[1];
              let userStr = decodeURIComponent(userMatch[1]);
              userStr = userStr.replace(/#.*$/, '');
              const user = JSON.parse(userStr);
              
              console.log('✅ Вход через Google успешен, пользователь:', user);
              
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              
              await signIn(token, user);
              
              if (user.role === 'admin') {
                router.replace('/(admin)/dashboard');
              } else {
                router.replace('/(user)/home');
              }
            }
          }
        } else if (result.type === 'cancel') {
          console.log('❌ Пользователь отменил вход через Google');
          Alert.alert('Отменено', 'Вход через Google был отменен');
        }
        
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Ошибка входа через Google:', error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(
        'Ошибка',
        'Произошла ошибка при входе через Google. Попробуйте позже.'
      );
      setLoading(false);
    }
  }, [signIn, router]);

  // Обработчик "Забыли пароль?"
  const handleForgotPassword = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/auth/forgot-password');
  }, [router]);

  // Обработчик перехода на регистрацию
  const handleGoToRegister = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/auth/register');
  }, [router]);

  // Мемоизированные адаптивные стили
  const adaptiveStyles = useMemo(() => ({
    logoSize: isSmallScreen ? 50 : isMediumScreen ? 60 : 70,
    titleSize: isSmallScreen ? 26 : isMediumScreen ? 32 : 36,
    subtitleSize: isSmallScreen ? 14 : 16,
    inputHeight: isSmallScreen ? 52 : 56,
    buttonHeight: isSmallScreen ? 52 : 56,
    padding: isSmallScreen ? 16 : 20,
  }), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                  paddingHorizontal: adaptiveStyles.padding,
                },
              ]}
            >
              {/* Заголовок с логотипом */}
              <View style={styles.header}>
                <View style={[styles.logoContainer, { width: adaptiveStyles.logoSize + 40, height: adaptiveStyles.logoSize + 40, borderRadius: (adaptiveStyles.logoSize + 40) / 2 }]}>
                  <Ionicons name="cloud" size={adaptiveStyles.logoSize} color={COLORS.white} />
                </View>
                <Text style={[styles.title, { fontSize: adaptiveStyles.titleSize }]}>VPS Billing</Text>
                <Text style={[styles.subtitle, { fontSize: adaptiveStyles.subtitleSize }]}>
                  Войдите в свой аккаунт
                </Text>
              </View>

              {/* Форма входа */}
              <Animated.View
                style={[
                  styles.formContainer,
                  { transform: [{ translateX: shakeAnim }] },
                ]}
              >
                {/* Поле Email */}
                <View style={styles.inputWrapper}>
                  <View style={[styles.inputContainer, errors.email && touched.email && styles.inputError, { height: adaptiveStyles.inputHeight }]}>
                    <Ionicons name="mail-outline" size={20} color={errors.email && touched.email ? COLORS.error : COLORS.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor={COLORS.gray}
                      value={email}
                      onChangeText={handleEmailChange}
                      onBlur={() => handleBlur('email')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      returnKeyType="next"
                      accessibilityLabel="Поле ввода email"
                    />
                  </View>
                  {errors.email && touched.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                {/* Поле Пароль */}
                <View style={styles.inputWrapper}>
                  <View style={[styles.inputContainer, errors.password && touched.password && styles.inputError, { height: adaptiveStyles.inputHeight }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={errors.password && touched.password ? COLORS.error : COLORS.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Пароль"
                      placeholderTextColor={COLORS.gray}
                      value={password}
                      onChangeText={handlePasswordChange}
                      onBlur={() => handleBlur('password')}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      accessibilityLabel="Поле ввода пароля"
                    />
                    <TouchableOpacity
                      onPress={handleTogglePassword}
                      style={styles.eyeIcon}
                      accessibilityLabel={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={COLORS.gray}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && touched.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                {/* Запомнить меня и Забыли пароль */}
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={styles.rememberMeContainer}
                    onPress={handleToggleRememberMe}
                    accessibilityLabel="Запомнить меня"
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                      {rememberMe && (
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      )}
                    </View>
                    <Text style={styles.rememberMeText}>Запомнить меня</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleForgotPassword} accessibilityLabel="Забыли пароль?">
                    <Text style={styles.forgotPasswordText}>Забыли пароль?</Text>
                  </TouchableOpacity>
                </View>

                {/* Кнопка входа */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled, { height: adaptiveStyles.buttonHeight }]}
                  onPress={handleLogin}
                  disabled={loading}
                  accessibilityLabel="Войти в систему"
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <Text style={styles.loginButtonText}>Войти</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Разделитель */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>или</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Кнопка входа через Google */}
                <TouchableOpacity
                  style={[styles.googleButton, { height: adaptiveStyles.buttonHeight }]}
                  onPress={handleGoogleLogin}
                  disabled={loading}
                  accessibilityLabel="Войти через Google"
                >
                  <Ionicons name="logo-google" size={20} color={COLORS.white} style={styles.googleIcon} />
                  <Text style={styles.googleButtonText}>Войти через Google</Text>
                </TouchableOpacity>

                {/* Ссылка на регистрацию */}
                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>Нет аккаунта? </Text>
                  <TouchableOpacity onPress={handleGoToRegister} accessibilityLabel="Перейти к регистрации">
                    <Text style={styles.registerLink}>Зарегистрироваться</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Тестовые данные */}
              <View style={styles.testCredentials}>
                <Text style={styles.testTitle}>Тестовые данные:</Text>
                <Text style={styles.testText}>Админ: admin@vps-billing.com / admin123</Text>
                <Text style={styles.testText}>Пользователь: john@individual.com / user123</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Мемоизация компонента для предотвращения лишних ре-рендеров
export default React.memo(LoginScreen);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT - 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
  },
  rememberMeText: {
    color: COLORS.darkGray,
    fontSize: 14,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.gray,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: COLORS.googleRed,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: COLORS.googleRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: COLORS.darkGray,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  testCredentials: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  testText: {
    fontSize: 11,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
});
