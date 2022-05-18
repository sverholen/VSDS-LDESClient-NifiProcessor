FROM maven:3.8.5-openjdk-17 AS builder
COPY . /nifi-processors-bundle
WORKDIR /nifi-processors-bundle
RUN mvn clean install

FROM agturley/nifi:1.16.0-jdk17
WORKDIR /opt/nifi/nifi-current
COPY --from=builder /nifi-processors-bundle/ldes-processors/target/*.nar ./lib/
