/******************************************************************************
 *
 * Copyright (c) 2024 Oracle and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *****************************************************************************/

import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi, params }) {

  const lang = params.language;
  if (lang !== "all" && lang !== "java")
  {
    return null;
  }  
    
  let content = `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>asyncapi.websocket.client.template</groupId>
  <artifactId>AsyncapiWebSocketClientEndpoint</artifactId>
  <version>1.0-SNAPSHOT</version>
  <packaging>jar</packaging>

  <name>AsyncapiWebSocketClientEndpoint</name>
  <url>http://maven.apache.org</url>

  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.target>1.8</maven.compiler.target>
    <maven.compiler.source>1.8</maven.compiler.source>
  </properties>

  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>3.8.1</version>
      <scope>test</scope>
    </dependency>
    <dependency>
       <groupId>jakarta.websocket</groupId>
       <artifactId>jakarta.websocket-client-api</artifactId>
       <version>2.2.0</version>
    </dependency>
    <dependency>
       <groupId>org.glassfish.tyrus.bundles</groupId>
       <artifactId>tyrus-standalone-client</artifactId>
       <version>2.0.0</version>
    </dependency>
    <dependency>
       <groupId>org.apache.httpcomponents</groupId>
       <artifactId>httpclient</artifactId>
       <version>4.5.14</version>
    </dependency>
    <dependency>
       <groupId>javax.json</groupId>
       <artifactId>javax.json-api</artifactId>
       <version>1.1.4</version>
    </dependency>
    <dependency>
       <groupId>org.glassfish</groupId>
       <artifactId>javax.json</artifactId>
       <version>1.1.4</version>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-shade-plugin</artifactId>
            <version>3.2.4</version>
              <executions>
                <execution>
                  <phase>package</phase>
                  <goals>
                    <goal>shade</goal>
                  </goals>
                  <configuration>
                    <transformers>
                      <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                        <mainClass>asyncapi.websocket.client.template.AsyncapiWebSocketClientEndpoint</mainClass>
                      </transformer>
                    </transformers>
                  </configuration>
                </execution>
              </executions>
      </plugin>
    </plugins>
  </build>

</project>
`;

  return (
    <File name="pom.xml">
      {
        content
      }
    </File>
  );
}
