const { ApolloServer, gql, PubSub } = require("apollo-server");


const users = [];

const typeDefs = gql`
    type User{
        username: String!
        password: String!,
        id: String
    }

    type Query {
        user: User,
        users: [User]
    }

    type Error {
        field: String!
        message: String!
    }

    type Response {
        user:User,
        errors: [Error]!
    }
    input UserInfo {
        username: String!
        password: String!
    }
    type Mutation {
        addUser(user:UserInfo): Response
        removeUser(id:String):Response
    }
    type Subscription {
        newUser: User!
    }
`;


const NEW_USER = "NEW USER";

const resolvers = {
    Query: {
        users: () => users,
        user:()=>({
            username: "peter", 
            password: Math.random().toString()
        })
    },
    Mutation : {
        addUser: (parent, args, { pubsub }, info) => {
            const user = {...args.user, id: users.length};
            console.log(args, user);

            users.push(user);
            pubsub.publish(NEW_USER, {
                newUser: user
            });

            return {
                user
            };
        },
        removeUser: (parent, args,context, info) =>{
            const userindex = users.findIndex(u=>u.id===args.id);
            if(userindex!=-1){
                return {
                    user: users.splice()[0],
                    errors: []
                }
            }
            return {
                errors: [
                    {
                        field: "id",
                        message: "id doesnt exists"
                    }
                ]
            }
        }
    },
    Subscription: {
        newUser : {
            subscribe: (parent, args, context) => pubsub.asyncIterator(NEW_USER)
        }
    }
};


const pubsub = new PubSub();



const server = new ApolloServer({ typeDefs, resolvers,
    context : ({ req,res}) => ({
        req,res, pubsub
    })
});

server.listen().then(({ url }) => console.log(`server started at ${url}`));