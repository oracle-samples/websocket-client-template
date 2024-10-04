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
`github.com/google/go-cmp v0.5.9 h1:O2Tfq5qg4qc4AmwVlvv0oLiVAGB7enBSJ2x2DqQFi38=
github.com/google/go-cmp v0.5.9/go.mod h1:17dUlkBOakJ0+DkrSSNjCkIjxS6bF9zb3elmeNGIjoY=
github.com/gorilla/websocket v1.5.1 h1:gmztn0JnHVt9JZquRuzLw3g4wouNVzKL15iLr/zn/QY=
github.com/gorilla/websocket v1.5.1/go.mod h1:x3kM2JMyaluk02fnUJpQuwD2dCS5NDG2ZHL0uE0tcaY=
github.com/icholy/digest v0.1.23 h1:4hX2pIloP0aDx7RJW0JewhPPy3R8kU+vWKdxPsCCGtY=
github.com/icholy/digest v0.1.23/go.mod h1:QNrsSGQ5v7v9cReDI0+eyjsXGUoRSUZQHeQ5C4XLa0Y=
golang.org/x/net v0.29.0 h1:5ORfpBpCs4HzDYoodCDBbwHzdR5UrLBZ3sOnUJmFoHo=
golang.org/x/net v0.29.0/go.mod h1:gLkgy8jTGERgjzMic6DS9+SP0ajcu6Xu3Orq/SpETg0=
golang.org/x/sys v0.25.0 h1:r+8e+loiHxRqhXVl6ML1nO3l1+oFoWbnlu2Ehimmi34=
golang.org/x/sys v0.25.0/go.mod h1:/VUhepiaJMQUp4+oa/7Zr1D23ma6VTLIYjOOTFZPUcA=
golang.org/x/term v0.24.0 h1:Mh5cbb+Zk2hqqXNO7S1iTjEphVL+jb8ZWaqh/g+JWkM=
golang.org/x/term v0.24.0/go.mod h1:lOBK/LVxemqiMij05LGJ0tzNr8xlmwBRJ81PX6wVLH8=
gotest.tools/v3 v3.5.1 h1:EENdUnS3pdur5nybKYIh2Vfgc8IUNBjxDPSjtiJcOzU=
gotest.tools/v3 v3.5.1/go.mod h1:isy3WKz7GK6uNw/sbHzfKBLvlvXwUyV06n6brMxxopU=
`;

  return (
    <File name="go.sum">
      {content
      }
    </File>
  );
}
