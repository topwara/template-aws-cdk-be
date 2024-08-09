FROM node:18
WORKDIR /workdir

RUN curl -L "https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip" -o "samcli.zip"
RUN unzip samcli.zip -d sam-installation
RUN ./sam-installation/install
RUN sam --version

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

ENV HOME /root

RUN mkdir -p $HOME/.aws
COPY .awsconfig      $HOME/.aws/config
COPY .awscredentials $HOME/.aws/credentials

RUN npm install -g esbuild
RUN npm install -g aws-cdk
RUN npm install -g typescript

EXPOSE 3000