-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Profiles Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    age INT,
    gender VARCHAR(20),
    state VARCHAR(50),
    district VARCHAR(50),
    occupation VARCHAR(50),
    annual_income NUMERIC,
    category VARCHAR(20),
    education_level VARCHAR(50),
    disability_status BOOLEAN DEFAULT FALSE,
    marital_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. User Documents Metadata Table
CREATE TABLE IF NOT EXISTS user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'Aadhaar', 'Income Certificate', 'Caste Certificate'
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- e.g., 'user_id/aadhaar.pdf' inside bucket
    file_url VARCHAR(1000) NOT NULL, -- Public or signed URL
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Policies for users table (if accessing directly via client SDK)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policies for user_documents table
CREATE POLICY "Users can view own documents" ON user_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON user_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON user_documents
    FOR DELETE USING (auth.uid() = user_id);
