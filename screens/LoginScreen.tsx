import React from 'react'
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native'
import { useAuth } from '../hooks/useAuth'

export default function LoginScreen() {
  const { signInWithKakao, loading } = useAuth()

  const handleKakaoLogin = async () => {
    try {
      const { error } = await signInWithKakao()
      if (error) {
        Alert.alert('Login Error', error.message)
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View className="flex-1 justify-center items-center bg-white px-8">
      <View className="mb-16">
        <Text className="text-3xl font-bold text-center mb-4 text-gray-900">
          Prayer List
        </Text>
        <Text className="text-base text-center text-gray-600">
          Please login to access prayer topics
        </Text>
      </View>

      <Pressable
        onPress={handleKakaoLogin}
        className="w-full bg-yellow-400 px-6 py-4 rounded-lg active:bg-yellow-500"
      >
        <Text className="text-center text-black font-semibold text-lg">
          Login with Kakao
        </Text>
      </Pressable>

      <Text className="text-sm text-gray-500 text-center mt-8">
        By logging in, you agree to our Terms of Service
      </Text>
    </View>
  )
}