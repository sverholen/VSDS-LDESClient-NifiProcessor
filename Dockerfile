# syntax=docker/dockerfile:1

FROM maven:3.8.5-openjdk-17 AS builder
RUN git clone https://github.com/Informatievlaanderen/VSDS-LDES.git
WORKDIR /VSDS-LDES
#RUN git checkout 69356992e012803b5fa4fb13a7bcfdf110ffcf55 # Use version 0.0.1-SNAPSHOT
RUN mvn install

COPY . /nifi-processors-bundle
WORKDIR /nifi-processors-bundle
RUN mvn install

FROM agturley/nifi:1.16.0-jdk17
WORKDIR /opt/nifi/nifi-current
COPY --from=builder /nifi-processors-bundle/ldes-processors/target/*.nar ./lib/
