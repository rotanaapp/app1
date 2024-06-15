pipeline {
    agent any
    parameters {
        string(name: 'release_version', defaultValue: '1.0.0', description: 'Please enter release version:')
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
                            "Release Note :   ${RELEASE_NOTE} \n"  +
                            "===================================================="

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
            sh 'echo "Build Stage"'
            script{
                def command = 
                """
                    ssh root@172.31.5.119 'cat ${env.DEPLOY_PATH}/.env'
                """
                // Read the .env file content
                def envFileContent = sh(script: command, returnStdout: true).trim()
                
                // Print the content of the .env file
                def newEnvironmentFileContent = "# .env file\n"
                // Process the .env file content, e.g., parse and set environment variables
                envFileContent.tokenize('\n').each { line ->
                    def parts = line.split('=')
                    if (parts.size() == 2) {
                        def key = parts[0].trim()
                        def value = parts[1].trim()
                        echo "key:" + key +" => " + value
                    if(key=="APP1_VERSION"){
                        if(value!= VERSION){
                            steps {
                                sh """
                                    docker build -t $env.REGISTRY/$env.PROJECT_NAME:${VERSION} .
                                """
                            }
                        }
                    }
                }
            }
        }
        stage('Push Image') {
            steps {
                echo "push image to docker hub"
                
            script{
                    def command = 
                    """
                        ssh root@172.31.5.119 'cat ${env.DEPLOY_PATH}/.env'
                    """
                    // Read the .env file content
                    def envFileContent = sh(script: command, returnStdout: true).trim()
                    
                    // Print the content of the .env file
                    def newEnvironmentFileContent = "# .env file\n"
                    // Process the .env file content, e.g., parse and set environment variables
                    envFileContent.tokenize('\n').each { line ->
                        def parts = line.split('=')
                        if (parts.size() == 2) {
                            def key = parts[0].trim()
                            def value = parts[1].trim()
                            echo "key:" + key +" => " + value
                        if(key=="APP1_VERSION"){
                            if(value!= VERSION){
                                steps {
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
                        }
                    }
                }
            }
        }
        stage('Deploy App') {
            steps {
                script{
                    echo "Deployment Application"
                    def command = 
                    """
                        ssh root@172.31.5.119 'cat ${env.DEPLOY_PATH}/.env'
                    """
                    
                      // Read the .env file content
                      def envFileContent = sh(script: command, returnStdout: true).trim()
                      
                      // Print the content of the .env file
                      echo "Content of .env original file:\n${envFileContent}"
                        def newEnvironmentFileContent = "# .env file\n"
                      // Process the .env file content, e.g., parse and set environment variables
                        envFileContent.tokenize('\n').each { line ->
                            def parts = line.split('=')
                            if (parts.size() == 2) {
                                def key = parts[0].trim()
                                def value = parts[1].trim()
                                echo "key:" + key +" => " + value
                            if(key=="APP1_VERSION"){
                                newEnvironmentFileContent +="${key}=${VERSION}\n"
                            }else if(key=="APP2_VERSION"){
                                newEnvironmentFileContent +="${key}=${value}\n"
                            }else if(key=="APP3_VERSION"){ 
                                newEnvironmentFileContent +="${key}=${value}"
                            }
                          }
                      }
                      echo "Content of .env new file:\n${newEnvironmentFileContent}"
                        def commandWrite = """
                            ssh root@172.31.5.119 'echo "${newEnvironmentFileContent}" > ${env.DEPLOY_PATH}/.env'
                        """
                        
                        // Execute the SSH command and capture the return status
                        def status = sh(script: commandWrite, returnStatus: true)

                        def v = sh(script: "ssh root@172.31.5.119 ${env.DEPLOY_PATH}/start.sh", returnStatus: true)
                }
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
                    "Release Note :   ${RELEASE_NOTE} \n"  +                           "Release Note :   ${RELEASE_NOTE} \n"  +
                    "===================================================="
                    

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