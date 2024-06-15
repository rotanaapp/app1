pipeline {
    agent any
    parameters {
        string(name: 'release_version', defaultValue: 'v1.0.0', description: 'Please enter release version:')
        string(name: 'release_note', defaultValue: '', description: 'Please enter release note:')
    }
    environment {
        PROJECT_NAME = 'app1'
        REGISTRY     = 'phairotana'

        RELEASE_NOTE = "${params.release_note}"
        VERSION = "${params.release_version}"
        DEPLOY_PATH  = "/opt/devops/assI/ms-demo/ms-deployment"

        // *** Telegram Credentials
        TELE_TOKEN = credentials('TELEGRAM_BOT_TOKEN')
        TELE_G_ID = credentials('TELEGRAM_GROUP_ID')
    }

    stages {
        stage('Configure') {
             // *** Action Post
             post {
                always {
                    script {
                        def TEXT_BUILD = "" +
                            "Project Name :   ${env.JOB_NAME} \n" +
                            "Builder Name :   ${env.BUILD_USER} \n" +
                            "Build Status :   🏃 START DEPLOY \n" +
                            "Release Tags :   [#${env.BUILD_NUMBER}] ${VERSION} \n"  +
                            "Release Note :   ${RELEASE_NOTE}"

                        withCredentials([
                            string(credentialsId: 'TELEGRAM_BOT_TOKEN', variable: 'TELE_TOKEN'),
                            string(credentialsId: 'TELEGRAM_GROUP_ID', variable: 'TELE_G_ID')
                        ]) {   
                            sh """
                                curl -s -X POST https://api.telegram.org/bot${TELE_TOKEN}/sendMessage \
                                -d chat_id=${TELE_G_ID} \
                                -d text="${TEXT_BUILD}" \
                                -d parse_mode=HTML
                            """
                        }
                    }
                }
            }
             
            steps {
                sh 'echo "Git clone ..."' 
                git branch: 'main', credentialsId: 'GITHUB-CREDENTIAL-ID', url: 'https://github.com/rotanaapp/app1.git'
            }

        }
        stage('Build Image') {
            steps {
                sh 'echo "Build Stage"'
                sh """
                    docker build -t $env.REGISTRY/$env.PROJECT_NAME:${VERSION} .
                """
            }
        }
        stage('Push Image') {
            steps {
                echo "push image to docker hub"
                withCredentials([usernamePassword(credentialsId: 'DOCKER-CREDENTIAL-ID', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh """
                        echo 'Login docker hub account.'
                        docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD

                        echo 'Pushing image to docker repository.'
                        docker push $env.REGISTRY/$env.PROJECT_NAME:${VERSION}
                    """
                }
            }
        }
        stage('Deploy App') {
            steps {
                echo "Deployment Application"
                sh """
                    ssh root@172.31.5.119 $env.DEPLOY_PATH/start.sh ${VERSION} 
                """
            }
        }
        
    }

    // *** Action Post
    post {
        always {
            script {

                def statusString
                def result = currentBuild.currentResult
                if (result == 'SUCCESS') {
                    statusString = "🟢 SUCCESS"
                } else if (result == 'FAILURE') {
                    statusString = "🔴 FAILURE"
                } else if (result == 'ABORTED') {
                    statusString =  "🟡 ABORTED"
                } else {
                    statusString = "❓ UNKNOWN"
                }

                def TEXT_BUILD = "" +
                    "Project Name :   ${env.JOB_NAME} \n" +
                    "Builder Name :   ${env.BUILD_USER} \n" +
                    "Build Status :   ${statusString} \n" +
                    "Release Tags :   [#${env.BUILD_NUMBER}] ${VERSION} \n"  +
                    "Release Note :   ${RELEASE_NOTE}"

                withCredentials([
                    string(credentialsId: 'TELEGRAM_BOT_TOKEN', variable: 'TELE_TOKEN'),
                    string(credentialsId: 'TELEGRAM_GROUP_ID', variable: 'TELE_G_ID')
                ]) {   
                    sh """
                        curl -s -X POST https://api.telegram.org/bot${TELE_TOKEN}/sendMessage \
                        -d chat_id=${TELE_G_ID} \
                        -d text="${TEXT_BUILD}" \
                        -d parse_mode=HTML
                    """
                }

                // *** Clean after built
                cleanWs()
            }
        } 
    }
}