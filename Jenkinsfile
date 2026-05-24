pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Restore') {
            steps {
                sh 'dotnet restore Study.API/Study.API.csproj'
            }
        }

        stage('Backend Build') {
            steps {
                sh 'dotnet build Study.API/Study.API.csproj --configuration Release --no-restore'
            }
        }

        stage('Frontend Install') {
            steps {
                dir('study-frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('study-frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Compose Validate') {
            steps {
                sh 'docker compose config'
            }
        }

        stage('Docker Compose Build') {
            steps {
                sh 'docker compose build'
            }
        }

    }

    post {
        success {
            echo 'Pipeline başarıyla tamamlandı.'
        }
        failure {
            echo 'Pipeline başarısız oldu.'
        }
    }
}
