# Nexus GraphQL + MongoDB

## 시작하기

Github 저장소를 만듭니다.

example: [https://github.com/eunchurn/nexus-graphql-mongoose-boilerplate](https://github.com/eunchurn/nexus-graphql-mongoose-boilerplate)

그리고 로컬에 clone하여 바로 시작합니다.

- Initialize NPM

```jsx
npm init -y
```

- TypeScript 설치

```jsx
yarn add -D typescript
npx tsc --init
```

`tsconfig.json` 파일이 생성됩니다.

여기서 `tsconfig.json` 파일을 수정합니다. `outDir: './dist'` `rootDir: './src'`

- Source 폴더 만들기

```jsx
mkdir src
```

- `package.json` 수정

```jsx
{
	"scripts": {
    "dev": "ts-node-dev src/index.ts"
  }
}
```

- 개발 패키지 설치

```jsx
yarn add -D @types/node ts-node ts-node-dev
```

타입스크립트와 개발 도구들이 설치되었습니다.

이제 `graphql`, `apollo-server-express`, `nexus` 를 설치합니다.

```jsx
yarn add apollo-server-express graphql nexus
```

- 서버 환경

```tsx
import { ApolloServer, Config } from "apollo-server-express";
import express from "express";
import { schema } from "./schema";

export async function startServer() {
  const config: Config = {
    schema,
    playground: true,
  }
  const server = new ApolloServer(config);
  // await server.start();
  const app = express();
  server.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("listen 4000")
  });

  return { server, app }
}
```

- GraphQL Schema

Apollo 서버의 GraphQL 스키마는 `typeDefs` 와 `resolvers` 로 이뤄집니다. `graphql-express` 과 마찬가지입니다.

하지만 실행가능한 스키마를 만드는 방법은 여러방법이 있습니다. graphql-tools 를 이용하여 `makeExecutableSchema` 를 호출하여 `typeDefs` 와 `resolvers` 를 통해 만드는 방법이 있지만, 우리에겐 code-first-development (CDL)를 사용하려고 합니다. schema-first-development (SDL) 방식도 익혀둘 필요가 있습니다. 

위 둘의 장단점은 여러 블로그에서 참고해서 익혀두시길 바랍니다. 

- Nexus GraphQL Schema

```tsx
import { makeSchema } from "nexus";
import * as types from "./types"
import path from "path";

export const schema = makeSchema({
  types,
  outputs: {
    schema: path.join(__dirname, "../generated/schema.graphql"),
    typegen: path.join(__dirname, "../generated/types.ts")
  }
})
```

Nexus는 `makeSchema` 로 Code-First 스키마를 구현해줍니다. Nexus가 가진 모든 타입 제너레이터를 이해할 필요가 있습니다.

ExecutableSchema는 `types` 라는 폴더에서 모든 Nexus 함수들을 넣어줍니다.

TODO: `makeSchema` 옵션 정리

스키마파일과 타입은 생성하지 않아도 Nexus 프레임워크는 엔드포인트를 생성하고 타입을 유지합니다. 참고용으로 스키마와 타입을 생성시킵니다.

- REST API with Express

앞에 서버 환경을 설정할 때 눈치채신 분들도 있겠지만, `apollo-server` 를 사용하지 않고 `apollo-server-express` 를 사용한 이유가 여기 있습니다. Express `APP` 을 미들웨어로 사용하기 위함입니다. 필요 없다면 `apollo-server` 를 쓰면 됩니다.

- Context 생성

우리는 모든 엔드포인트에서 사용할 수 있는 Context를 구현할 수 있습니다. 앞서 설정한 `server` 인스턴스에 전달하기만 하면 됩니다.

하지만 중요한 점 하나가 Nexus 프레임워크에도 우리가 만들어낼 Context를 이해할 수 있어야 타입을 제대로 생성할 수 있습니다.

`schema/index.ts` 

```tsx
export const schema = makeSchema({
// ...
  contextType: {
    module: require.resolve("../context"),
    export: "Context",
  },
// ...
});
```

우리가 만들어낼 컨텍스트의 위치로 모듈을 지정해주고 타입 이름을 지정해줍니다.

이제 실제 Context를 만들어봅니다.

```tsx
import { Request, Response } from "express";
import * as mongoClient from "../models"

interface ExpressContext {
  request: Request;
  response: Response;
}

interface Context extends ExpressContext {
  mongoClient: mongoClient.MongoModel;
}
```

아마 우리에게 익숙한 `prisma` 클라이언트는 여기 없습니다. (단비 개발자들은 모두 알고 있기 때문에.. 생략) MongoClient를 설명드리기 위해 우선 여기서 MongoDB 클라이언트를 위한 `models` 라는 폴더를 만들어야 합니다. 그리고 이 컨텍스트는 서버가 실행될 때 한번 실행됩니다. 그래서 이 컨텍스트에서 실행할 수 있는 서비스들을 구동시킵니다.

실제 Context가 담기는지 테스트를 하기 위해 임의의 함수를 만들어서 테스트를 해봅니다.

`context/index.ts`

```tsx
import { Request, Response } from "express";

interface ExpressContext {
  request: Request;
  response: Response;
}

interface Context extends ExpressContext {
  testFunction(): string;
}

export async function context(req: ExpressContext): Promise<Context> {
  const { request, response } = req;
  return {
    request,
    response,
    testFunction() { return "hello danbi" },
  }
}
```

그리고 `server.ts` 를 수정해줍니다.

```tsx
import { context } from "./context";

  const config: Config = {
    schema,
    context,
    playground: true,
  }
 
```

서버는 자동실행될 때 마다 타입을 생성하지만 간혹 못하는 경우가 있으니 `package.json` 에 `generate` 스크립트를 추가하도록 합니다.

```json
{
  "scripts": {
    "dev": "ts-node-dev src/index.ts",
    "generate": "ts-node src/schema/index.ts"
  },
}
```

이제 `types` 안에 있는 타입 리졸버들을 테스트해봅니다.

`schema/types/Queries.ts` 

```tsx
import { queryType } from "nexus";

export const Queries = queryType({
  definition(t) {
    t.string("token", {
      resolve(_root, _args, ctx) {
        const { testFunction } = ctx;
        return testFunction();
      }
    })
  }
})
```

## MongoDB Client

### docker-compose 설정

우리는 개발환경인 우리 PC에 native한 애플리케이션을 설정하여 개발할 수도 있지만, docker를 활용하여 가상머신을 활용하는 편이 volume 관리에도 정신건강에도 좋다고 확신합니다.

Production 환경에서는 당연히 별도의 엔드포인트를 가지겠지만, 개발환경에서는 적어도 DB서버는 가상화해서 공유하고 있는 편이 좋습니다.

`docker-compose.yml` 

```yaml
version: "3.1"
services:
  mongo:
    image: mongo
    environment:
      MONGO_INITDB_DATABASE: project
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
      MONGODB_USER: ${MONGODB_USER}
      MONGODB_PASS: ${MONGODB_PASS}
    ports:
      - 27000:27017
    volumes:
      - dbdata:/data/db
  mongo-express:
    image: mongo-express
    restart: always
    depends_on:
      - mongo
    ports:
      - ${VCAP_APP_PORT}:${VCAP_APP_PORT}
    environment:
      ME_CONFIG_MONGODB_SERVER: mongo
      ME_CONFIG_MONGODB_ADMINUSERNAME: ${MONGO_INITDB_ROOT_USERNAME}
      ME_CONFIG_MONGODB_ADMINPASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
      VCAP_APP_HOST: ${VCAP_APP_HOST}
      VCAP_APP_PORT: ${VCAP_APP_PORT}
volumes:
  dbdata:
```

docker 관련 세미나는 추후에...

이러한 docker-compose 파일을 만듭니다. 유심히 보면 `${}` 을 사용하고 있습니다. 이 말은 이 파일시스템이든 버전관리시스템이든 민감한 정보는 별도로 관리하겠단 뜻입니다. 즉 이 변수들은 컴퓨터 앱을 실행할 때 생성되는 프로세스의 환경에서 값을 가져오겠다는 뜻입니다. `docker` 편리하게도 `.env` 파일이 있으면 자동으로 주입합니다. 따라서 .env 파일도 만들어줍니다.

`.env` 

```bash
# MongoDB

MONGO_URL=localhost
MONGO_URL_PROD=localhost
MONGO_PORT=27000
MONGO_COLLECTION_NAME=danbi
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=password
MONGODB_USER=danbicorp
MONGODB_PASS=password
VCAP_APP_HOST=0.0.0.0
VCAP_APP_PORT=8081
ME_CONFIG_MONGODB_SERVER=0.0.0.0
ME_CONFIG_MONGODB_PORT=27000
ME_CONFIG_MONGODB_ADMINUSERNAME=danbicorp
ME_CONFIG_MONGODB_ADMINPASSWORD=password
```

여러개의 MongoDB를 사용할 수 있으므로, 포트번호는 27000으로 해줍니다.

```bash
docker compose up -d
```

데몬으로 실행합니다. 이 때 docker hub에 회원가입하지 않은 유저는 pull이 안됩니다. MongoDB community 는 사용자를 특정 해주길 원하기 때문에 docker에 회원가입하고 shell 에서 로그인을 해야합니다.

### Mongoose 설치

JavaScript 환경에서는 `mongoose` 가 가장 많이 쓰입니다.

```bash
yarn add mongoose
```

루트에 `mongo.ts` 를 만들어줍니다. `context` 폴더안에 만들어도 되고, 편한 곳에 위치하면 됩니다. 이 파일은 DB접속만 시켜줍니다. DB접속 주소는 앞서 만든 `.env` 파일을 활용해 줍니다. 이를 위해서는 `dotenv` 패키지가 설치 되어 있어야 합니다.

```tsx
import mongoose, { CallbackError } from "mongoose";
import "dotenv/config";

const uri = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGO_URL}:${process.env.MONGO_PORT}/?authMechanism=DEFAULT`;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});
// mongoose.set("debug", true);
mongoose.set("useCreateIndex", true);
const db = mongoose.connection;

const handleOpen = () => console.log("🚀 Connected to MongoDB");
const handleError = (error: CallbackError) =>
  console.log(`❌ Error on DB connection: ${error}`);

db.once("open", handleOpen);
db.on("error", handleError);
```

이제 `context` 에서 이 파일을 임포트해줍니다.

```tsx
import "../mongo";
```

### Mongo Model

이제 모델을 만들 차례입니다.

`models` 폴더를 만들고, 예시로 사용자(User)를 만들어봅니다.

`models/User.ts` 

```tsx
import { Schema, model, Document, Model } from "mongoose";

const UserSchema = new Schema<UserDocument, UserModel>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    min: 8,
    max: 32,
  },
  resetPasswordToken: {
    type: String,
    required: true,
  },
  validateEmailToken: {
    type: String,
    required: true,
  },
  isEmailValidate: Boolean,
  isApproved: Boolean,
});

export interface UserDocument extends Document {
  email: string;
  password: string;
  resetPasswordToken: string;
  validateEmailToken: string;
  isEmailValidate: boolean;
  isApproved: boolean;
}

export type UserModel = Model<UserDocument>;

export const User = model<UserDocument, UserModel>("User", UserSchema);
```

`UserSchema`, `UserDocument` 를 만듭니다. `UserSchema` 는 Mongo Model 이고, `UserDocument` 는 Mongo의 `Document` 타입을 확장하여 우리의 타입스크립트 타입을 만듭니다.

> 타입 만들기를 2번 작업(nexus까지 3번) 해야하는데, 언젠가 Prisma가 해결해 줄 것이라 믿습니다.

결국 이파일에서 `export` 하고 사용할 객체는 `User` 입니다.

이 `User` 의 타입을 클라이언트에 알려야하기 때문에 `models/Types.ts` 에 클라이언트 타입을 만들어주어야 합니다.

`models/Types.ts` 

```tsx
import { UserModel } from ".";

export interface MongoModel {
  User: UserModel;
}
```

### 엔드포인트 작업

네 맞습니다. `objectType` 또한 우리가 만들어줘야 합니다.

`context` 에서 `mongo.ts` 임포트하고, 일단 `queryField` 에서 동작하는지 확인해봅시다.

```tsx
import { queryType, stringArg } from "nexus";

export const Queries = queryType({
  definition(t) {
    t.string("user", {
      args: { email: stringArg() },
      async resolve(_root, { email }, { mongoClient }) {
        const user = await mongoClient.User.findOne({ email: email || "" });
        console.log(user);
        return user?.email || ""
      }
    })
  }
})
```

사용자 생성을 위해 단순한 `Mutation` 도 만들어봅니다.

`schema/types/Mutations.ts`

```tsx
import { mutationType, stringArg } from "nexus";

export const Mutation = mutationType({
  definition(t) {
    t.string("user", {
      args: { email: stringArg(), name: stringArg() },
      async resolve(_root, { email, name }, { mongoClient }) {
        const user = await mongoClient.User.create({ email, name })
        return user.name;
      }
    })
  }
})
```

사용자를 생성하고

```graphql
mutation {
  user(email: "ec.park@danbicorp.com", name: "박은천")
}
```

사용자를 쿼리해봅니다.

```graphql
query {
  user(email: "ec.park@danbicorp.com")
}
```

`objectType` 만드는 것은 생략

### Mongo Client

앞서 docker-compose 에 우리는 mongo express도 가동을 시켜놨습니다.

[http://localhost:8082/](http://localhost:8082/)

[https://www.mongodb.com/products/compass](https://www.mongodb.com/products/compass)