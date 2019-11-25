FROM node:12.6-stretch
LABEL "com.github.actions.name"="Publish"
LABEL "com.github.actions.description"="Publish to NPM if VERSION is updated"
LABEL "com.github.actions.icon"="share"
LABEL "com.github.actions.color"="purple"
LABEL "maintainer"="John Henry <john@iamjohnhenry.com>"

ADD entrypoint.sh /entrypoint.sh
RUN apt-get update && apt-get install -y git jq
RUN npm install -g np
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
