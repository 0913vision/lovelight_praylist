#!/bin/bash

set -e

if [ ! -f .env ]; then
  echo "Error: .env file not found"
  exit 1
fi

export $(grep -v '^#' .env | xargs)

if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ] || [ -z "$EXPO_PUBLIC_KAKAO_APP_KEY" ]; then
  echo "Error: Missing required environment variables in .env"
  exit 1
fi

eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "$EXPO_PUBLIC_SUPABASE_URL" --environment preview --environment production --visibility sensitive

eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "$EXPO_PUBLIC_SUPABASE_ANON_KEY" --environment preview --environment production --visibility sensitive

eas env:create --name EXPO_PUBLIC_KAKAO_APP_KEY --value "$EXPO_PUBLIC_KAKAO_APP_KEY" --environment preview --environment production --visibility sensitive

eas env:list
