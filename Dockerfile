FROM maven:3.8.5-openjdk-17 AS builder
COPY . /nifi-processors-bundle
WORKDIR /nifi-processors-bundle
RUN mvn clean package


FROM agturley/nifi:1.16.0-jdk17
COPY --from=builder /nifi-processors-bundle/nifi-processors-nar/target/nifi-processors-nar.nar ./lib/
