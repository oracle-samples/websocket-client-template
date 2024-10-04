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

  if (lang !== "all" && lang !== "go")
  {
    return null;
  }  
    
  let content =
`module client

go 1.22.2

require (
    github.com/gorilla/websocket v1.5.1
    github.com/icholy/digest v0.1.23
    golang.org/x/term v0.24.0
)

require (
    golang.org/x/net v0.29.0 // indirect
    golang.org/x/sys v0.25.0 // indirect
)
`;

  return (
    <File name="go.mod">
      {content
      }
    </File>
  );
}
